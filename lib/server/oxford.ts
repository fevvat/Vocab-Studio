import seedData from '@/data/oxford3000.seed.json';
import { OxfordWord } from '@/lib/types';

const oxfordWords = (seedData as OxfordWord[])
  .filter((item) => item.normalized)
  .sort((a, b) => a.word.localeCompare(b.word));
const byNormalized = new Map(oxfordWords.map((item) => [item.normalized, item]));

export function getOxfordDataset() {
  return oxfordWords;
}

export function getOxfordCatalogMeta() {
  return {
    localCount: oxfordWords.length,
    declaredTarget: 3000,
    completeness: Math.round((oxfordWords.length / 3000) * 100),
  };
}

export function findOxfordWord(word: string) {
  return byNormalized.get(word.toLowerCase().trim()) ?? null;
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}

export function suggestOxfordWord(word: string) {
  const normalized = word.toLowerCase().trim();
  if (!normalized) return null;

  let best: OxfordWord | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of oxfordWords) {
    const score = levenshtein(normalized, candidate.normalized);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
      if (score === 0) break;
    }
  }

  if (!best) return null;
  const limit = normalized.length <= 4 ? 1 : normalized.length <= 7 ? 2 : 3;
  if (bestScore > limit) return null;

  return {
    word: best.word,
    distance: bestScore,
    item: best,
    confidence: Math.max(0.45, 1 - bestScore / Math.max(best.normalized.length, 4)),
  };
}
