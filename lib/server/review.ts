import { WeakWord } from '@/lib/types';

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function createWeakWord(word: string, isCorrect: boolean): WeakWord {
  const now = new Date();
  const interval = isCorrect ? 2 : 1;
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + interval);

  return {
    word,
    normalized: word.toLowerCase(),
    wrongCount: isCorrect ? 0 : 1,
    correctCount: isCorrect ? 1 : 0,
    recentFailures: isCorrect ? 0 : 1,
    accuracy: isCorrect ? 100 : 0,
    priority: isCorrect ? 0.35 : 1,
    lastSeenAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    reviewInterval: interval,
    repetition: isCorrect ? 1 : 0,
    easeFactor: isCorrect ? 2.4 : 1.8,
  };
}

export function updateWeakWord(entry: WeakWord, isCorrect: boolean) {
  const now = new Date();
  entry.lastSeenAt = now.toISOString();

  if (isCorrect) {
    entry.correctCount += 1;
    entry.recentFailures = 0;
    entry.repetition += 1;
    entry.easeFactor = round(Math.min(2.8, entry.easeFactor + 0.1));
    entry.reviewInterval = Math.max(1, Math.round((entry.reviewInterval || 1) * entry.easeFactor));
  } else {
    entry.wrongCount += 1;
    entry.recentFailures += 1;
    entry.repetition = 0;
    entry.easeFactor = round(Math.max(1.3, entry.easeFactor - 0.2));
    entry.reviewInterval = 1;
  }

  const attempts = entry.correctCount + entry.wrongCount;
  entry.accuracy = attempts ? Math.round((entry.correctCount / attempts) * 100) : 0;
  entry.priority = round((entry.wrongCount * 1.4) + (entry.recentFailures * 0.8) + ((100 - entry.accuracy) / 50));

  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + entry.reviewInterval);
  entry.nextReviewAt = nextReview.toISOString();
}
