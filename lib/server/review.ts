import { QuizAnswer, ReviewSelfRating, WeakWord } from '@/lib/types';

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function scheduleNextReview(entry: WeakWord, multiplier = 1) {
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + Math.max(1, Math.round(entry.reviewInterval * multiplier)));
  entry.nextReviewAt = nextReview.toISOString();
}

export function computePriority(entry: WeakWord) {
  const duePenalty = new Date(entry.nextReviewAt) <= new Date() ? 1.25 : 0.35;
  const speedPenalty = entry.avgResponseTimeMs ? Math.min(entry.avgResponseTimeMs / 4000, 1.2) : 0;
  const confidencePenalty = entry.confidenceScore !== undefined ? (1 - entry.confidenceScore) * 1.1 : 0.2;
  return round(
    (entry.wrongCount * 1.55)
    + (entry.recentFailures * 0.95)
    + ((100 - entry.accuracy) / 45)
    + duePenalty
    + speedPenalty
    + confidencePenalty
    - Math.min(entry.correctCount * 0.08, 0.8),
  );
}

export function createWeakWord(word: string, isCorrect: boolean): WeakWord {
  const now = new Date();
  const interval = isCorrect ? 2 : 1;
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + interval);

  const entry: WeakWord = {
    word,
    normalized: word.toLowerCase(),
    wrongCount: isCorrect ? 0 : 1,
    correctCount: isCorrect ? 1 : 0,
    recentFailures: isCorrect ? 0 : 1,
    accuracy: isCorrect ? 100 : 0,
    priority: 0,
    lastSeenAt: now.toISOString(),
    nextReviewAt: nextReview.toISOString(),
    reviewInterval: interval,
    repetition: isCorrect ? 1 : 0,
    easeFactor: isCorrect ? 2.4 : 1.8,
    avgResponseTimeMs: 0,
    confidenceScore: 0.5,
    mastered: false,
    sourceUnitIds: [],
  };

  entry.priority = computePriority(entry);
  return entry;
}

export function updateWeakWord(entry: WeakWord, isCorrect: boolean, signal?: Pick<QuizAnswer, 'responseTimeMs' | 'confidence'>) {
  const now = new Date();
  entry.lastSeenAt = now.toISOString();

  const lastResponseMs = Math.max(0, Number(signal?.responseTimeMs ?? 0));
  const confidence = Math.min(1, Math.max(0, Number(signal?.confidence ?? 0.5)));
  const prevAvg = entry.avgResponseTimeMs ?? 0;
  entry.avgResponseTimeMs = prevAvg > 0 && lastResponseMs > 0
    ? round((prevAvg * 0.7) + (lastResponseMs * 0.3), 0)
    : (lastResponseMs || prevAvg || 0);
  entry.confidenceScore = round(((entry.confidenceScore ?? 0.5) * 0.75) + (confidence * 0.25));

  const speedFactor = lastResponseMs > 0
    ? lastResponseMs > 10000 ? 0.82 : lastResponseMs < 3500 ? 1.08 : 1
    : 1;
  const confidenceFactor = confidence >= 0.85 ? 1.06 : confidence <= 0.35 ? 0.86 : 1;

  if (isCorrect) {
    entry.correctCount += 1;
    entry.recentFailures = 0;
    entry.repetition += 1;
    entry.easeFactor = round(Math.min(2.9, entry.easeFactor + (confidence >= 0.8 ? 0.12 : 0.08)));
    entry.reviewInterval = Math.max(1, Math.round((entry.reviewInterval || 1) * entry.easeFactor * speedFactor * confidenceFactor));
  } else {
    entry.wrongCount += 1;
    entry.recentFailures += 1;
    entry.repetition = 0;
    entry.easeFactor = round(Math.max(1.3, entry.easeFactor - (confidence <= 0.35 ? 0.25 : 0.2)));
    entry.reviewInterval = lastResponseMs > 0 && lastResponseMs < 3500 ? 2 : 1;
  }

  const attempts = entry.correctCount + entry.wrongCount;
  entry.accuracy = attempts ? Math.round((entry.correctCount / attempts) * 100) : 0;
  entry.mastered = entry.correctCount >= 4 && entry.accuracy >= 80 && entry.recentFailures === 0 && (entry.confidenceScore ?? 0) >= 0.65;
  entry.priority = computePriority(entry);
  scheduleNextReview(entry);
}

export function applySelfRating(entry: WeakWord, rating: ReviewSelfRating) {
  entry.lastSeenAt = new Date().toISOString();

  if (rating === 'easy') {
    entry.easeFactor = round(Math.min(2.9, entry.easeFactor + 0.12));
    entry.reviewInterval = Math.max(2, Math.round(entry.reviewInterval * 1.45));
    entry.priority = Math.max(0.2, round(entry.priority - 0.65));
    entry.mastered = entry.correctCount >= 4 && entry.accuracy >= 80;
    scheduleNextReview(entry, 1.1);
    return;
  }

  if (rating === 'hard') {
    entry.easeFactor = round(Math.max(1.3, entry.easeFactor - 0.15));
    entry.reviewInterval = 1;
    entry.recentFailures += 1;
    entry.priority = computePriority(entry) + 0.6;
    entry.mastered = false;
    scheduleNextReview(entry, 0.75);
    return;
  }

  entry.priority = computePriority(entry);
  scheduleNextReview(entry, 1);
}
