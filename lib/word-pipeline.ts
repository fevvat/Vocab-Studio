import { findOxfordWord, suggestOxfordWord } from '@/lib/server/oxford';
import { InputMethod, ParsedWordCandidate } from '@/lib/types';

const commonNoise = new Set(['oxford', 'list', 'words', 'unit', 'page', 'set', 'lesson', 'chapter']);

export function normalizeToken(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1|]/g, 'l')
    .replace(/[5]/g, 's')
    .replace(/[€]/g, 'e')
    .replace(/[3]/g, 'e')
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
    .replace(/''+/g, "'");
}

function basicLemma(token: string) {
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2);
  return token;
}

export function parseRawWords(raw: string) {
  const cleaned = raw
    .replace(/[	;,/]+/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/[()\[\]{}]/g, ' ');

  const matches = cleaned.match(/[A-Za-z][A-Za-z'\-]{1,24}/g) ?? [];
  return matches
    .map((token) => normalizeToken(token))
    .map((token) => basicLemma(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !commonNoise.has(token));
}

function buildSingleCandidate(token: string, method: InputMethod): ParsedWordCandidate {
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
}

export function buildCandidates(raw: string, method: InputMethod): ParsedWordCandidate[] {
  const tokens = parseRawWords(raw);
  const unique = [...new Set(tokens)];
  return unique.map((token) => buildSingleCandidate(token, method));
}

export function buildCandidateForWord(raw: string, method: InputMethod) {
  const token = normalizeToken(raw);
  if (!token) return null;
  return buildSingleCandidate(basicLemma(token), method);
}

export function serializeCandidates(candidates: ParsedWordCandidate[]) {
  return candidates.map((item) => item.word).join('\n');
}

export function hydrateWordsFromText(raw: string, method: InputMethod) {
  return buildCandidates(raw, method).map((item) => item.word);
}
