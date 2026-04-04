import { findOxfordWord, suggestOxfordWord } from '@/lib/server/oxford';
import { InputMethod, ParsedWordCandidate } from '@/lib/types';

const commonNoise = new Set(['oxford', 'list', 'words', 'unit', 'page', 'set']);

export function normalizeToken(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'l')
    .replace(/[5]/g, 's')
    .replace(/[€]/g, 'e')
    .replace(/[|]/g, 'l')
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
    .replace(/''+/g, "'");
}

export function parseRawWords(raw: string) {
  const cleaned = raw
    .replace(/[\t;,/]+/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/[()\[\]{}]/g, ' ');

  const matches = cleaned.match(/[A-Za-z][A-Za-z'\-]{1,24}/g) ?? [];
  return matches
    .map((token) => normalizeToken(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !commonNoise.has(token));
}

export function buildCandidates(raw: string, method: InputMethod): ParsedWordCandidate[] {
  const tokens = parseRawWords(raw);
  const unique = [...new Set(tokens)];

  return unique.map((token) => {
    const exact = findOxfordWord(token);
    if (exact) {
      return {
        original: token,
        word: exact.word,
        normalized: exact.normalized,
        status: 'confirmed',
        confidence: method === 'text' ? 1 : 0.98,
        matchedOxford: true,
        level: exact.level,
      } satisfies ParsedWordCandidate;
    }

    const suggestion = suggestOxfordWord(token);
    if (suggestion) {
      return {
        original: token,
        word: token,
        normalized: token,
        status: method === 'text' ? 'suggested' : 'suspicious',
        confidence: suggestion.confidence,
        matchedOxford: false,
        suggestion: suggestion.word,
        level: suggestion.item.level,
      } satisfies ParsedWordCandidate;
    }

    return {
      original: token,
      word: token,
      normalized: token,
      status: token.length <= 2 ? 'suspicious' : 'suggested',
      confidence: method === 'text' ? 0.74 : 0.58,
      matchedOxford: false,
    } satisfies ParsedWordCandidate;
  });
}

export function serializeCandidates(candidates: ParsedWordCandidate[]) {
  return candidates.map((item) => item.word).join('\n');
}

export function hydrateWordsFromText(raw: string, method: InputMethod) {
  return buildCandidates(raw, method).map((item) => item.word);
}
