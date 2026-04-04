import { DifficultyLevel, QuestionStyle, Quiz, QuizMode, QuizQuestion, StudyUnit, WordMeta } from '@/lib/types';
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

async function pickWords(unit: StudyUnit, count: number, difficulty: DifficultyLevel, mode: QuizMode) {
  const capped = capQuestionCount(count, unit.words.length);
  const weakWords = await getWeakWords();
  const unitWordMap = new Map(unit.words.map((word) => [word.normalized, word]));
  const dueWeak = weakWords
    .filter((item) => unitWordMap.has(item.normalized))
    .filter((item) => mode === 'weak_only' || mode === 'review' ? true : item.wrongCount > 0)
    .sort((a, b) => b.priority - a.priority)
    .map((item) => unitWordMap.get(item.normalized)!)
    .filter(Boolean);

  const allWords = [...unit.words];
  if (difficulty === 'hard') allWords.sort((a, b) => b.word.length - a.word.length);
  if (difficulty === 'easy') allWords.sort((a, b) => a.word.length - b.word.length);

  const newWords = allWords.filter((item) => !weakWords.some((weak) => weak.normalized === item.normalized));
  const mixedPool = shuffle(allWords);

  if (mode === 'weak_only') return shuffle(dueWeak.length ? dueWeak : allWords).slice(0, capped);
  if (mode === 'new_only') return shuffle(newWords.length ? newWords : allWords).slice(0, capped);
  if (mode === 'review') return shuffle(dueWeak.length ? dueWeak : allWords).slice(0, capped);
  if (mode === 'mixed_old_new') {
    const half = Math.max(2, Math.floor(capped / 2));
    return shuffle([...dueWeak.slice(0, half), ...newWords.slice(0, capped - half), ...mixedPool]).slice(0, capped);
  }

  return shuffle([...dueWeak.slice(0, Math.ceil(capped / 3)), ...mixedPool]).slice(0, capped);
}

function mutateSpelling(word: string) {
  if (word.length < 4) return `${word}e`;
  const chars = word.split('');
  const index = Math.min(1, chars.length - 2);
  [chars[index], chars[index + 1]] = [chars[index + 1], chars[index]];
  return chars.join('');
}

function buildOptions(correct: string, pool: string[]) {
  const filtered = pool.filter((item) => item && item !== correct);
  const distractors = shuffle(filtered).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

function buildMeaningQuestion(meta: WordMeta, all: WordMeta[]): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'meaning',
    prompt: `“${meta.word}” kelimesinin en uygun Türkçe karşılığı hangisidir?`,
    options: buildOptions(meta.translationTr, all.map((item) => item.translationTr)),
    correctAnswer: meta.translationTr,
    explanation: `${meta.word} → ${meta.translationTr}. ${meta.definitionEn}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildContextQuestion(meta: WordMeta, all: WordMeta[]): QuizQuestion {
  const escaped = meta.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sentence = (meta.example || `I use ${meta.word} every day.`).replace(new RegExp(escaped, 'ig'), '_____');
  return {
    id: crypto.randomUUID(),
    type: 'context',
    prompt: `Boşluğu en uygun kelimeyle tamamla: ${sentence}`,
    options: buildOptions(meta.word, all.map((item) => item.word)),
    correctAnswer: meta.word,
    explanation: `Doğru cevap ${meta.word}. ${meta.example}${meta.exampleTr ? ` / ${meta.exampleTr}` : ''}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildTranslationQuestion(meta: WordMeta, all: WordMeta[]): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'translation',
    prompt: `Aşağıdaki Türkçe karşılığa uygun İngilizce kelime hangisidir? → ${meta.translationTr}`,
    options: buildOptions(meta.word, all.map((item) => item.word)),
    correctAnswer: meta.word,
    explanation: `${meta.translationTr} ifadesine en uygun kelime ${meta.word}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildReverseTranslationQuestion(meta: WordMeta, all: WordMeta[]): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    type: 'reverse_translation',
    prompt: `Aşağıdaki İngilizce kelimeye uygun Türkçe karşılığı seç: ${meta.word}`,
    options: buildOptions(meta.translationTr, all.map((item) => item.translationTr)),
    correctAnswer: meta.translationTr,
    explanation: `${meta.word} kelimesinin günlük kullanımdaki karşılığı: ${meta.translationTr}.`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildSpellingQuestion(meta: WordMeta): QuizQuestion {
  const wrongA = mutateSpelling(meta.word);
  const wrongB = `${meta.word}${meta.word.at(-1) ?? ''}`;
  const wrongC = meta.word.replace(/[aeiou]/i, 'a');

  return {
    id: crypto.randomUUID(),
    type: 'spelling',
    prompt: `Doğru yazımı seç. İpucu: ${meta.translationTr}`,
    options: buildOptions(meta.word, [wrongA, wrongB, wrongC]),
    correctAnswer: meta.word,
    explanation: `${meta.word} kelimesinin doğru yazımı budur. Türkçesi: ${meta.translationTr}`,
    word: meta.word,
    translationTr: meta.translationTr,
    example: meta.example,
  };
}

function buildQuestion(style: QuestionStyle, meta: WordMeta, all: WordMeta[]) {
  switch (style) {
    case 'meaning':
      return buildMeaningQuestion(meta, all);
    case 'context':
      return buildContextQuestion(meta, all);
    case 'translation':
      return buildTranslationQuestion(meta, all);
    case 'reverse_translation':
      return buildReverseTranslationQuestion(meta, all);
    case 'spelling':
      return buildSpellingQuestion(meta);
    case 'mixed':
    default: {
      const pool: QuestionStyle[] = ['meaning', 'context', 'translation', 'reverse_translation', 'spelling'];
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return buildQuestion(chosen, meta, all);
    }
  }
}

export async function generateQuiz(
  unit: StudyUnit,
  style: QuestionStyle,
  difficulty: DifficultyLevel,
  requestedCount: number,
  mode: QuizMode,
): Promise<Quiz> {
  const selectedWords = await pickWords(unit, requestedCount, difficulty, mode);
  const metas = await enrichWords(selectedWords.map((item) => item.word));
  const questions = metas.map((meta) => buildQuestion(style, meta, metas));

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
