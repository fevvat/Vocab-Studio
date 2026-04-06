import {
  AppDatabase,
  DashboardSummary,
  ProgressByLevel,
  Quiz,
  ReviewSelfRating,
  Settings,
  StudyUnit,
  WeakWord,
} from '@/lib/types';
import { applySelfRating, createWeakWord, updateWeakWord } from '@/lib/server/review';
import { getOxfordCatalogMeta, getOxfordDataset } from '@/lib/server/oxford';
import { readRawDb, storageMode, writeRawDb } from '@/lib/server/storage';

const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 100,
  preferredDifficulty: 'medium',
  preferredQuestionStyle: 'mixed',
  preferredQuizMode: 'mixed',
};

const DEFAULT_DB: AppDatabase = {
  studyUnits: [],
  quizzes: [],
  settings: DEFAULT_SETTINGS,
  weakWords: [],
  activityLog: [],
};

function normalizeWeakWord(item: Partial<WeakWord> & { word?: string; normalized?: string }): WeakWord {
  const word = item.word ?? item.normalized ?? '';
  const wrongCount = Number(item.wrongCount ?? 0);
  const correctCount = Number(item.correctCount ?? 0);
  const recentFailures = Number(item.recentFailures ?? Math.max(0, wrongCount - correctCount));
  const accuracy = Number(
    item.accuracy ?? ((wrongCount + correctCount) ? Math.round((correctCount / (wrongCount + correctCount)) * 100) : 0),
  );
  const reviewInterval = Number(item.reviewInterval ?? 1);
  const repetition = Number(item.repetition ?? 0);
  const easeFactor = Number(item.easeFactor ?? 2.1);
  const priority = Number(item.priority ?? (wrongCount + recentFailures));
  const now = new Date().toISOString();

  return {
    word,
    normalized: (item.normalized ?? word).toLowerCase(),
    wrongCount,
    correctCount,
    recentFailures,
    accuracy,
    priority,
    lastSeenAt: item.lastSeenAt ?? now,
    nextReviewAt: item.nextReviewAt ?? now,
    reviewInterval,
    repetition,
    easeFactor,
    avgResponseTimeMs: Number(item.avgResponseTimeMs ?? 0),
    confidenceScore: Number(item.confidenceScore ?? 0.5),
    mastered: Boolean(item.mastered ?? (correctCount >= 4 && accuracy >= 80 && recentFailures === 0)),
    sourceUnitIds: Array.isArray(item.sourceUnitIds) ? item.sourceUnitIds : [],
  };
}

function normalizeDb(raw: Partial<AppDatabase>): AppDatabase {
  const rawSettings = (raw.settings ?? {}) as Partial<Settings> & { preferredQuizType?: Settings['preferredQuestionStyle'] };

  return {
    studyUnits: Array.isArray(raw.studyUnits)
      ? raw.studyUnits.map((unit) => ({
        ...unit,
        inputMethod: unit.inputMethod ?? 'image',
        suspiciousCount: unit.suspiciousCount ?? (unit.words ?? []).filter((word) => word.status !== 'confirmed').length,
        words: (unit.words ?? []).map((word) => ({
          ...word,
          original: word.original ?? (word as { text?: string }).text ?? word.word,
          word: word.word ?? (word as { text?: string }).text ?? '',
          normalized: (word.normalized ?? (word as { text?: string }).text ?? '').toLowerCase(),
          status: word.status ?? 'confirmed',
          confidence: word.confidence ?? 1,
          matchedOxford: word.matchedOxford ?? false,
        })),
      }))
      : [],
    quizzes: Array.isArray(raw.quizzes)
      ? raw.quizzes.map((quiz) => ({
        ...quiz,
        style: quiz.style ?? ((quiz as unknown as { type?: Quiz['style'] }).type ?? 'mixed'),
        mode: quiz.mode ?? 'mixed',
      }))
      : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      preferredQuestionStyle: rawSettings.preferredQuestionStyle ?? rawSettings.preferredQuizType ?? 'mixed',
      preferredQuizMode: rawSettings.preferredQuizMode ?? 'mixed',
    },
    weakWords: Array.isArray(raw.weakWords) ? raw.weakWords.map((item) => normalizeWeakWord(item)) : [],
    activityLog: Array.isArray(raw.activityLog) ? raw.activityLog : [],
  };
}

export async function readDb(): Promise<AppDatabase> {
  const raw = await readRawDb(DEFAULT_DB);
  return normalizeDb(raw);
}

export async function writeDb(db: AppDatabase) {
  await writeRawDb(db);
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getSortedWeakWords(words: WeakWord[]) {
  return [...words].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt);
  });
}

function calculateStreak(logDates: string[]) {
  const uniqueDays = [...new Set(logDates.map((item) => item.slice(0, 10)))].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (uniqueDays.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yesterday = cursor.toISOString().slice(0, 10);
      return uniqueDays.includes(yesterday) ? 1 : 0;
    }

    return streak;
  }
}

function upsertWeakWord(
  list: WeakWord[],
  word: string,
  isCorrect: boolean,
  unitId?: string,
  signal?: { responseTimeMs?: number; confidence?: number },
) {
  const normalized = word.toLowerCase();
  const existing = list.find((item) => item.normalized === normalized);

  if (!existing) {
    const fresh = createWeakWord(word, isCorrect);
    if (signal?.responseTimeMs !== undefined) fresh.avgResponseTimeMs = signal.responseTimeMs;
    if (signal?.confidence !== undefined) fresh.confidenceScore = signal.confidence;
    if (unitId) fresh.sourceUnitIds = [unitId];
    list.push(fresh);
    return fresh;
  }

  existing.word = word;
  if (unitId) {
    existing.sourceUnitIds = Array.from(new Set([...(existing.sourceUnitIds ?? []), unitId]));
  }
  updateWeakWord(existing, isCorrect, signal);
  return existing;
}

export async function getStudyUnits() {
  const db = await readDb();
  return [...db.studyUnits].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getStudyUnit(id: string) {
  const db = await readDb();
  return db.studyUnits.find((unit) => unit.id === id) ?? null;
}

export async function saveStudyUnit(unit: StudyUnit) {
  const db = await readDb();
  db.studyUnits.unshift(unit);
  db.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'study-unit-created',
    createdAt: new Date().toISOString(),
    title: `${unit.title} oluşturuldu`,
    meta: { wordCount: unit.wordCount, source: unit.inputMethod },
  });
  await writeDb(db);
  return unit;
}

export async function getQuiz(id: string) {
  const db = await readDb();
  return db.quizzes.find((quiz) => quiz.id === id) ?? null;
}

export async function getQuizzes() {
  const db = await readDb();
  return [...db.quizzes].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function saveQuiz(quiz: Quiz) {
  const db = await readDb();
  db.quizzes.unshift(quiz);
  await writeDb(db);
  return quiz;
}

export async function saveQuizResult(quizId: string, result: Quiz['result']) {
  const db = await readDb();
  const quiz = db.quizzes.find((item) => item.id === quizId);
  if (!quiz || !result) return null;

  quiz.result = result;
  db.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'quiz-completed',
    createdAt: new Date().toISOString(),
    title: `${quiz.questionCount} soruluk quiz tamamlandı`,
    meta: {
      accuracy: result.accuracy,
      score: result.score,
      mode: quiz.mode,
    },
  });

  for (const answer of result.answers) {
    upsertWeakWord(db.weakWords, answer.word, answer.isCorrect, quiz.studyUnitId, {
      responseTimeMs: answer.responseTimeMs,
      confidence: answer.confidence,
    });
  }

  await writeDb(db);
  return quiz;
}

export async function applyQuizReflection(quizId: string, rating: ReviewSelfRating) {
  const db = await readDb();
  const quiz = db.quizzes.find((item) => item.id === quizId);
  if (!quiz?.result) return null;

  quiz.result.selfRating = rating;
  const touched = new Set(quiz.result.answers.map((item) => item.word.toLowerCase()));

  for (const weakWord of db.weakWords) {
    if (touched.has(weakWord.normalized)) {
      applySelfRating(weakWord, rating);
    }
  }

  db.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'quiz-reflected',
    createdAt: new Date().toISOString(),
    title: `Quiz sonrası öz değerlendirme kaydedildi`,
    meta: { rating },
  });

  await writeDb(db);
  return quiz;
}

export async function getWeakWords(options?: { dueOnly?: boolean }) {
  const db = await readDb();
  const words = options?.dueOnly
    ? db.weakWords.filter((word) => new Date(word.nextReviewAt) <= new Date())
    : db.weakWords;
  return getSortedWeakWords(words);
}

export async function getSettings() {
  const db = await readDb();
  return db.settings;
}

export async function saveSettings(settings: Partial<Settings>) {
  const db = await readDb();
  db.settings = {
    ...db.settings,
    ...settings,
  };
  db.activityLog.unshift({
    id: crypto.randomUUID(),
    type: 'settings-updated',
    createdAt: new Date().toISOString(),
    title: 'Ayarlar güncellendi',
    meta: { storage: storageMode() },
  });
  await writeDb(db);
  return db.settings;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await readDb();
  const totalWords = db.studyUnits.reduce((sum, item) => sum + item.wordCount, 0);
  const completed = db.quizzes.filter((quiz) => quiz.result);
  const avgAccuracy = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + (item.result?.accuracy ?? 0), 0) / completed.length)
    : 0;
  const today = startOfToday();
  const dueTodayCount = db.weakWords.filter((word) => new Date(word.nextReviewAt) <= new Date()).length;
  const todayStudiedWords = db.studyUnits
    .filter((unit) => new Date(unit.createdAt) >= today)
    .reduce((sum, unit) => sum + unit.wordCount, 0);
  const progressToGoal = Math.min(100, Math.round((todayStudiedWords / Math.max(db.settings.dailyGoal, 1)) * 100));
  const streak = calculateStreak(db.activityLog.map((item) => item.createdAt));

  const oxford = getOxfordDataset();
  const catalogMeta = getOxfordCatalogMeta();
  const studiedSet = new Set(db.studyUnits.flatMap((unit) => unit.words.map((word) => word.normalized)));
  const weakSet = new Set(
    db.weakWords.filter((item) => item.wrongCount > item.correctCount || item.recentFailures > 0).map((item) => item.normalized),
  );
  const masteredSet = new Set(db.weakWords.filter((item) => item.mastered).map((item) => item.normalized));
  const studiedOxfordCount = oxford.filter((item) => studiedSet.has(item.normalized)).length;
  const oxfordCoverage = oxford.length ? Math.round((studiedOxfordCount / oxford.length) * 100) : 0;
  const masteredCount = oxford.filter((item) => masteredSet.has(item.normalized)).length;
  const studiedNonOxfordCount = [...studiedSet].filter((item) => !oxford.some((word) => word.normalized === item)).length;

  const levels = ['A1', 'A2', 'B1', 'B2'];
  const progressByLevel: ProgressByLevel[] = levels.map((level) => {
    const items = oxford.filter((item) => item.level === level);
    return {
      level,
      total: items.length,
      studied: items.filter((item) => studiedSet.has(item.normalized)).length,
      mastered: items.filter((item) => masteredSet.has(item.normalized)).length,
      weak: items.filter((item) => weakSet.has(item.normalized)).length,
    };
  });

  return {
    totalUnits: db.studyUnits.length,
    totalWords,
    totalQuizzes: db.quizzes.length,
    averageAccuracy: avgAccuracy,
    weakWordCount: db.weakWords.filter((item) => item.wrongCount > item.correctCount || item.recentFailures > 0).length,
    reviewReadyCount: dueTodayCount,
    dueTodayCount,
    dailyGoal: db.settings.dailyGoal,
    todayStudiedWords,
    progressToGoal,
    recentActivity: db.activityLog.slice(0, 8),
    latestUnits: db.studyUnits.slice(0, 4),
    latestQuizzes: db.quizzes.slice(0, 4),
    topWeakWords: getSortedWeakWords(db.weakWords).slice(0, 8),
    streak,
    studiedOxfordCount,
    oxfordCoverage,
    masteredCount,
    progressByLevel,
    mostDifficultWords: getSortedWeakWords(db.weakWords).slice(0, 5),
    catalogWordCount: catalogMeta.localCount,
    studiedNonOxfordCount,
  };
}

export async function getDailyStudyPlan(quizId: string) {
  const db = await readDb();
  const quiz = db.quizzes.find((item) => item.id === quizId);
  if (!quiz?.result) return null;

  const dueWeakWords = getSortedWeakWords(
    db.weakWords.filter((word) => new Date(word.nextReviewAt) <= new Date()),
  ).slice(0, 10);

  const wrongSet = new Set(quiz.result.wrongWords.map((item) => item.toLowerCase()));
  const reinforcementWords = getSortedWeakWords(
    db.weakWords.filter((word) => wrongSet.has(word.normalized)),
  ).slice(0, 8);

  const studiedSet = new Set(db.studyUnits.flatMap((unit) => unit.words.map((word) => word.normalized)));
  const knownSet = new Set(db.weakWords.map((item) => item.normalized));
  const newWords = [...studiedSet].filter((item) => !knownSet.has(item)).slice(0, 7);

  return {
    minutes: 15,
    weakDueWords: dueWeakWords.map((item) => item.word),
    reinforcementWords: reinforcementWords.map((item) => item.word),
    newWords,
    recommendedModes: ['review', 'mixed_old_new', 'new_only'],
  };
}
