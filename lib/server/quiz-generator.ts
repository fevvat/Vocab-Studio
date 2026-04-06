import { DifficultyLevel, QuestionStyle, Quiz, QuizMode, QuizQuestion, StudyUnit, WordEntry, WordMeta } from '@/lib/types';
import { enrichWords } from '@/lib/server/enrich';
import { getWeakWords } from '@/lib/server/db';

function shuffle<T>(items: T[]): T[] {
  return [...items]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.value);
}

function capQuestionCount(requested: number, availableWords: number) {
  return Math.min(Math.max(requested, 5), Math.max(availableWords, 5));
}

function uniqueEntries(words: WordEntry[]) {
  return [...new Map(words.map((item) => [item.normalized, item])).values()];
}

function entryToMeta(entry: WordEntry): WordMeta {
  return {
    word: entry.word,
    normalized: entry.normalized,
    definitionEn: entry.definitionEn || `${entry.word} kelimesi için kısa açıklama bulunamadı.`,
    translationTr: entry.translationTr || `${entry.word} (kontrol edilmeli)`,
    example: entry.example || `I often use the word ${entry.word} in daily English.`,
    exampleTr: entry.exampleTr,
    partOfSpeech: entry.partOfSpeech || 'unknown',
    phonetic: '',
    level: entry.level,
    synonym: entry.synonym,
    antonym: entry.antonym,
    isOxford3000: entry.matchedOxford,
    source: entry.source || 'unit-cache',
  };
}

async function pickWords(unit: StudyUnit, count: number, mode: QuizMode) {
  const allWords = uniqueEntries(unit.words);
  const allWeakWords = await getWeakWords();
  const weakByNormalized = new Map(allWeakWords.map((item) => [item.normalized, item]));
  const dueWeakSet = new Set((await getWeakWords({ dueOnly: true })).map((item) => item.normalized));

  const dueWords = allWords.filter((word) => dueWeakSet.has(word.normalized));
  const weakWords = allWords.filter((word) => weakByNormalized.has(word.normalized));
  const newWords = allWords.filter((word) => !weakByNormalized.has(word.normalized));

  let pool: WordEntry[] = [];

  switch (mode) {
    case 'weak_only':
      pool = weakWords.length ? weakWords : allWords;
      break;
    case 'new_only':
      pool = newWords.length ? newWords : allWords;
      break;
    case 'review':
      pool = dueWords.length ? dueWords : (weakWords.length ? weakWords : allWords);
      break;
    case 'mixed_old_new': {
      const takeWeak = shuffle(dueWords.length ? dueWords : weakWords).slice(0, Math.ceil(count / 2));
      const takeNew = shuffle(newWords).slice(0, count - takeWeak.length);
      pool = uniqueEntries([...takeWeak, ...takeNew]);
      break;
    }
    case 'mixed':
    default: {
      const dueFirst = shuffle(dueWords).slice(0, Math.ceil(count * 0.35));
      const weakNext = shuffle(weakWords.filter((word) => !dueFirst.some((item) => item.normalized === word.normalized))).slice(0, Math.ceil(count * 0.25));
      const remainingCount = Math.max(count - dueFirst.length - weakNext.length, 0);
      const randomRest = shuffle(allWords.filter((word) => !dueFirst.some((item) => item.normalized === word.normalized) && !weakNext.some((item) => item.normalized === word.normalized))).slice(0, remainingCount);
      pool = uniqueEntries([...dueFirst, ...weakNext, ...randomRest]);
      break;
    }
  }

  const finalPool = shuffle(pool.length ? pool : allWords).slice(0, capQuestionCount(count, allWords.length));
  return finalPool;
}

function mutateSpelling(word: string) {
  if (word.length < 4) return `${word}${word.at(-1) ?? 'e'}`;
  const chars = word.split('');
  const swapIndex = Math.min(1, chars.length - 2);
  [chars[swapIndex], chars[swapIndex + 1]] = [chars[swapIndex + 1], chars[swapIndex]];
  return chars.join('');
}

function pickDistractors(values: string[], correct: string, count: number) {
  return shuffle([...new Set(values.filter((item) => item && item !== correct))]).slice(0, count);
}

function optionCountForDifficulty(difficulty: DifficultyLevel) {
  if (difficulty === 'easy') return 3;
  if (difficulty === 'hard') return 5;
  return 4;
}

function buildOptions(correct: string, pool: string[], difficulty: DifficultyLevel) {
  const distractors = pickDistractors(pool, correct, Math.max(optionCountForDifficulty(difficulty) - 1, 2));
  return shuffle([correct, ...distractors]);
}

function sentenceMask(sentence: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(escaped, 'ig'), '_____');
}

function buildMeaningQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'meaning',
    prompt: `“${meta.word}” kelimesinin en uygun Türkçe karşılığı hangisidir?`,
    options: buildOptions(meta.translationTr, all.map((item) => item.translationTr), difficulty),
    correctAnswer: meta.translationTr,
    explanation: `${meta.word} → ${meta.translationTr}. ${meta.definitionEn}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildContextQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  const sentence = sentenceMask(meta.example || `I use ${meta.word} every day.`, meta.word);
  return {
    id: crypto.randomUUID(),
    type: 'context',
    prompt: `Boşluğu en uygun kelimeyle tamamla: ${sentence}`,
    options: buildOptions(meta.word, all.map((item) => item.word), difficulty),
    correctAnswer: meta.word,
    explanation: `Doğru cevap ${meta.word}. ${meta.example}${meta.exampleTr ? ` / ${meta.exampleTr}` : ''}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildTranslationQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'translation',
    prompt: `Aşağıdaki Türkçe karşılığa uygun İngilizce kelime hangisidir? → ${meta.translationTr}`,
    options: buildOptions(meta.word, all.map((item) => item.word), difficulty),
    correctAnswer: meta.word,
    explanation: `${meta.translationTr} ifadesine en uygun kelime ${meta.word}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildReverseTranslationQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'reverse_translation',
    prompt: `Aşağıdaki İngilizce kelimeye uygun Türkçe karşılığı seç: ${meta.word}`,
    options: buildOptions(meta.translationTr, all.map((item) => item.translationTr), difficulty),
    correctAnswer: meta.translationTr,
    explanation: `${meta.word} kelimesinin günlük kullanımdaki karşılığı: ${meta.translationTr}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildTypedTranslationQuestion(meta: WordMeta): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'typed_translation',
    prompt: `Türkçe karşılığına göre İngilizce kelimeyi yaz: ${meta.translationTr}`,
    options: [],
    correctAnswer: meta.word,
    explanation: `Doğru yazım: ${meta.word}. ${meta.definitionEn}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
    inputMode: 'typed',
  };
}

function buildTypedReverseTranslationQuestion(meta: WordMeta): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'typed_reverse_translation',
    prompt: `İngilizce kelimenin Türkçe karşılığını yaz: ${meta.word}`,
    options: [],
    correctAnswer: meta.translationTr,
    explanation: `${meta.word} → ${meta.translationTr}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
    inputMode: 'typed',
  };
}

function buildSpellingQuestion(meta: WordMeta, difficulty: DifficultyLevel): QuizQuestion {
  const wrongs = [
    mutateSpelling(meta.word),
    `${meta.word}${meta.word.at(-1) ?? ''}`,
    meta.word.replace(/[aeiou]/i, 'a'),
    meta.word.replace(/(.)/, ''),
  ];

  return {
    id: crypto.randomUUID(),
    type: 'spelling',
    prompt: `Doğru yazımı seç. İpucu: ${meta.translationTr}`,
    options: buildOptions(meta.word, wrongs, difficulty),
    correctAnswer: meta.word,
    explanation: `${meta.word} kelimesinin doğru yazımı budur. Türkçesi: ${meta.translationTr}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildMeaningMatchQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'meaning_match',
    prompt: `Bu kısa açıklamaya en uygun kelimeyi seç: ${meta.definitionEn}`,
    options: buildOptions(meta.word, all.map((item) => item.word), difficulty),
    correctAnswer: meta.word,
    explanation: `${meta.word} kelimesinin tanımı: ${meta.definitionEn}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildExampleMatchQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'example_match',
    prompt: `Aşağıdaki cümlede kullanılan ana kelime hangisidir? ${meta.example}`,
    options: buildOptions(meta.word, all.map((item) => item.word), difficulty),
    correctAnswer: meta.word,
    explanation: `Bu cümlede öne çıkan kelime ${meta.word}. ${meta.exampleTr ? `Türkçesi: ${meta.exampleTr}` : ''}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildSynonymQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  const correct = meta.synonym || meta.word;
  const pool = all.map((item) => item.synonym || item.word);
  return {
    id: crypto.randomUUID(),
    type: 'synonym',
    prompt: `“${meta.word}” kelimesine en yakın anlamlı seçeneği bul.`,
    options: buildOptions(correct, pool, difficulty),
    correctAnswer: correct,
    explanation: `${meta.word} kelimesine en yakın anlam: ${correct}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildAntonymQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  const correct = meta.antonym || meta.word;
  const pool = all.map((item) => item.antonym || item.word);
  return {
    id: crypto.randomUUID(),
    type: 'antonym',
    prompt: `“${meta.word}” kelimesine en zıt anlamlı seçeneği bul.`,
    options: buildOptions(correct, pool, difficulty),
    correctAnswer: correct,
    explanation: `${meta.word} kelimesine zıt anlam olarak burada ${correct} kullanıldı.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildSentenceCompletionQuestion(meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel): QuizQuestion {
  const sentence = sentenceMask(meta.example || `I use ${meta.word} every day.`, meta.word);
  return {
    id: crypto.randomUUID(),
    type: 'sentence_completion',
    prompt: `Cümleyi anlamına göre tamamla: ${sentence}`,
    options: buildOptions(meta.word, all.map((item) => item.word), difficulty),
    correctAnswer: meta.word,
    explanation: `${meta.word} burada cümlenin anlamını tamamlayan en uygun kelime.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildTypedSentenceCompletionQuestion(meta: WordMeta): QuizQuestion {
  const sentence = sentenceMask(meta.example || `I use ${meta.word} every day.`, meta.word);
  return {
    id: crypto.randomUUID(),
    type: 'typed_sentence_completion',
    prompt: `Boşluğu yazarak tamamla: ${sentence}`,
    options: [],
    correctAnswer: meta.word,
    explanation: `Doğru kelime: ${meta.word}. ${meta.exampleTr ? `Cümle Türkçesi: ${meta.exampleTr}` : ''}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
    inputMode: 'typed',
  };
}

function buildQuestion(style: QuestionStyle, meta: WordMeta, all: WordMeta[], difficulty: DifficultyLevel) {
  switch (style) {
    case 'meaning':
      return buildMeaningQuestion(meta, all, difficulty);
    case 'context':
      return buildContextQuestion(meta, all, difficulty);
    case 'translation':
      return buildTranslationQuestion(meta, all, difficulty);
    case 'reverse_translation':
      return buildReverseTranslationQuestion(meta, all, difficulty);
    case 'typed_translation':
      return buildTypedTranslationQuestion(meta);
    case 'typed_reverse_translation':
      return buildTypedReverseTranslationQuestion(meta);
    case 'spelling':
      return buildSpellingQuestion(meta, difficulty);
    case 'meaning_match':
      return buildMeaningMatchQuestion(meta, all, difficulty);
    case 'example_match':
      return buildExampleMatchQuestion(meta, all, difficulty);
    case 'synonym':
      return buildSynonymQuestion(meta, all, difficulty);
    case 'antonym':
      return buildAntonymQuestion(meta, all, difficulty);
    case 'sentence_completion':
      return buildSentenceCompletionQuestion(meta, all, difficulty);
    case 'typed_sentence_completion':
      return buildTypedSentenceCompletionQuestion(meta);
    case 'mixed':
    default: {
      const pool: QuestionStyle[] = [
        'meaning',
        'context',
        'translation',
        'reverse_translation',
        'typed_translation',
        'typed_reverse_translation',
        'spelling',
        'meaning_match',
        'example_match',
        'synonym',
        'sentence_completion',
        'typed_sentence_completion',
      ];
      if (meta.antonym) pool.push('antonym');
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return buildQuestion(chosen, meta, all, difficulty);
    }
  }
}

function adaptMetaForDifficulty(meta: WordMeta, difficulty: DifficultyLevel) {
  if (difficulty === 'easy') {
    return {
      ...meta,
      example: meta.example.split(/[.!?]/)[0] || meta.example,
    };
  }

  if (difficulty === 'hard') {
    return {
      ...meta,
      definitionEn: `${meta.definitionEn} (${meta.partOfSpeech})`,
    };
  }

  return meta;
}

export async function generateQuiz(
  unit: StudyUnit,
  style: QuestionStyle,
  difficulty: DifficultyLevel,
  requestedCount: number,
  mode: QuizMode,
): Promise<Quiz> {
  const selectedWords = await pickWords(unit, requestedCount, mode);
  const metas = await enrichWords(selectedWords.map((item) => item.word), selectedWords).then((items) => items.map((meta) => adaptMetaForDifficulty(meta, difficulty)));
  const metaMap = new Map(metas.map((item) => [item.normalized, item]));
  const orderedMetas = selectedWords.map((word) => metaMap.get(word.normalized) || adaptMetaForDifficulty(entryToMeta(word), difficulty));
  const questions = orderedMetas.map((meta) => buildQuestion(style, meta, orderedMetas, difficulty));

  return {
    id: crypto.randomUUID(),
    studyUnitId: unit.id,
    createdAt: new Date().toISOString(),
    style,
    mode,
    difficulty,
    questionCount: questions.length,
    questions,
  };
}
