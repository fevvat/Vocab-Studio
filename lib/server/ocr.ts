import { buildCandidates, parseRawWords } from '@/lib/word-pipeline';
import { InputMethod } from '@/lib/types';

export function extractWordsFromText(raw: string, method: InputMethod = 'image') {
  return buildCandidates(raw, method).map((item) => item.word);
}

export function extractWordCandidates(raw: string, method: InputMethod = 'image') {
  return buildCandidates(raw, method);
}

export function extractRawTokens(raw: string) {
  return parseRawWords(raw);
}
