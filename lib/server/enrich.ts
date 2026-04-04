import { WordMeta } from '@/lib/types';
import { findOxfordWord } from '@/lib/server/oxford';

function fallbackMeta(word: string): WordMeta {
  return {
    word,
    normalized: word.toLowerCase(),
    definitionEn: `${word} kelimesi için yerel sözlük verisi bulunamadı.`,
    translationTr: `${word} (kontrol edilmeli)`,
    example: `I want to use the word ${word} in a simple daily sentence.`,
    exampleTr: `${word} kelimesini basit bir günlük cümlede kullanmak istiyorum.`,
    partOfSpeech: 'unknown',
    phonetic: '',
    isOxford3000: false,
    source: 'fallback',
  };
}

async function fetchDictionary(word: string) {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!response.ok) return null;
  return response.json();
}

async function fetchTranslation(word: string) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|tr`,
    );
    if (!response.ok) return '';
    const data = await response.json();
    return (data?.responseData?.translatedText as string | undefined) ?? '';
  } catch {
    return '';
  }
}

export async function enrichWord(word: string): Promise<WordMeta> {
  const clean = word.trim().toLowerCase();
  if (!clean) return fallbackMeta(word);

  const local = findOxfordWord(clean);
  if (local) {
    return {
      word: local.word,
      normalized: local.normalized,
      definitionEn: local.definitionEn,
      translationTr: local.translationTr,
      example: local.example,
      exampleTr: local.exampleTr,
      partOfSpeech: local.partOfSpeech,
      phonetic: '',
      level: local.level,
      synonym: local.synonym,
      antonym: local.antonym,
      isOxford3000: true,
      source: 'oxford-local',
    };
  }

  try {
    const [dictionary, translation] = await Promise.all([fetchDictionary(clean), fetchTranslation(clean)]);
    const entry = Array.isArray(dictionary) ? dictionary[0] : null;
    const meaning = entry?.meanings?.[0];
    const definition = meaning?.definitions?.[0];

    if (!entry || !meaning || !definition) {
      const meta = fallbackMeta(clean);
      meta.translationTr = translation || meta.translationTr;
      return meta;
    }

    return {
      word: clean,
      normalized: clean,
      definitionEn: definition.definition || fallbackMeta(clean).definitionEn,
      translationTr: translation || fallbackMeta(clean).translationTr,
      example: definition.example || `I am learning the word ${clean} every day.`,
      exampleTr: '',
      partOfSpeech: meaning.partOfSpeech || 'unknown',
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
      isOxford3000: false,
      source: 'dictionaryapi',
    };
  } catch {
    return fallbackMeta(clean);
  }
}

export async function enrichWords(words: string[]) {
  const unique = [...new Set(words.map((word) => word.toLowerCase().trim()).filter(Boolean))];
  const metas = await Promise.all(unique.map((word) => enrichWord(word)));
  return metas;
}
