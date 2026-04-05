import { kv } from '@vercel/kv';
import { cookies } from 'next/headers';
import { AppDatabase, DashboardSummary, ProgressByLevel, Quiz, Settings, StudyUnit, WeakWord } from '@/lib/types';
import { createWeakWord, updateWeakWord } from '@/lib/server/review';
import { getOxfordDataset } from '@/lib/server/oxford';

const DEFAULT_SETTINGS: Settings = {
  dailyGoal: 100,
  preferredDifficulty: 'medium',
  preferredQuestionStyle: 'mixed',
  preferredQuizMode: 'mixed',
};

async function getSessionId() {
  const cookieStore = await cookies();
  const session = cookieStore.get('vocab-user-session')?.value;
  return session || 'default_user';
}

function getCacheKey(sessionId: string) {
  return `vocab_db_${sessionId}`;
}

function normalizeWeakWord(item: Partial<WeakWord> & { word?: string; normalized?: string }): WeakWord {
  const word = item.word ?? item.normalized ?? '';
  const wrongCount = Number(item.wrongCount ?? 0);
  const correctCount = Number(item.correctCount ?? 0);
  const recentFailures = Number(item.recentFailures ?? Math.max(0, wrongCount - correctCount));
  const accuracy = Number(item.accuracy ?? ((wrongCount + correctCount) ? Math.round((correctCount / (wrongCount + correctCount)) * 100) : 0));
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
  };
}

function normalizeDb(raw: Partial<AppDatabase> | null): AppDatabase {
  if (!raw) raw = {};
  const rawSettings = (raw.settings ?? {}) as Partial<Settings> & { preferredQuizType?: Settings['preferredQuestionStyle'] };

  return {
    studyUnits: Array.isArray(raw.studyUnits) ? raw.studyUnits.map((unit) => ({
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
    })) : [],
    quizzes: Array.isArray(raw.quizzes) ? raw.quizzes.map((quiz) => ({
      ...quiz,
      style: quiz.style ?? (quiz as unknown as { type?: Quiz['style'] }).type ?? 'mixed',
      mode: quiz.mode ?? 'mixed',
    })) : [],
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
  const sessionId = await getSessionId();
  const dbData = await kv.get<Partial<AppDatabase>>(getCacheKey(sessionId));
  return normalizeDb(dbData);
}

export async function writeDb(db: AppDatabase) {
  const sessionId = await getSessionId();
  await kv.set(getCacheKey(sessionId), db);
}

export async function updateDb(updater: (db: AppDatabase) => void | Promise<void>): Promise<AppDatabase> {
  const db = await readDb();
  await updater(db);
  await writeDb(db);
  return db;
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
  await updateDb((db) => {
    db.studyUnits.unshift(unit);
    db.activityLog.unshift({
      id: crypto.randomUUID(),
      type: 'study-unit-created',
      createdAt: new Date().toISOString(),
      title: `${unit.title} oluşturuldu`,
      meta: { wordCount: unit.wordCount, source: unit.inputMethod },
    });
  });
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
  await updateDb((db) => {
    db.quizzes.unshift(quiz);
  });
  return quiz;
}

function upsertWeakWord(list: WeakWord[], word: string, isCorrect: boolean) {
  const normalized = word.toLowerCase();
  const existing = list.find((item) => item.normalized === normalized);

  if (!existing) {
    list.push(createWeakWord(word, isCorrect));
    return;
  }

  existing.word = word;
  updateWeakWord(existing, isCorrect);
}

export async function saveQuizResult(quizId: string, result: Quiz['result']) {
  let updatedQuiz: Quiz | null = null;

  await updateDb((db) => {
    const quiz = db.quizzes.find((item) => item.id === quizId);
    if (!quiz || !result) return;

    quiz.result = result;
    updatedQuiz = quiz;

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
      upsertWeakWord(db.weakWords, answer.word, answer.isCorrect);
    }
  });

  return updatedQuiz;
}

export async function getWeakWords() {
  const db = await readDb();
  return [...db.weakWords].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt);
  });
}

function calculateStreak(logDates: string[]) {
  const uniqueDays = [...new Set(logDates.map((item) => item.slice(0, 10)))].sort().reverse();
  let streak = 0;
  const cursor = new Date();

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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await readDb();
  const totalWords = db.studyUnits.reduce((sum, item) => sum + item.wordCount, 0);
  const completed = db.quizzes.filter((quiz) => quiz.result);
  const avgAccuracy = completed.length
    ? Math.round(completed.reduce((sum, item) => sum + (item.result?.accuracy ?? 0), 0) / completed.length)
    : 0;
  const reviewReadyCount = db.weakWords.filter((word) => new Date(word.nextReviewAt) <= new Date()).length;
  const progressToGoal = Math.min(100, Math.round((totalWords / Math.max(db.settings.dailyGoal, 1)) * 100));
  const streak = calculateStreak(db.activityLog.map((item) => item.createdAt));

  const oxford = getOxfordDataset();
  const studiedSet = new Set(db.studyUnits.flatMap((unit) => unit.words.map((word) => word.normalized)));
  const weakSet = new Set(db.weakWords.filter((item) => item.wrongCount > item.correctCount).map((item) => item.normalized));
  const masteredSet = new Set(db.weakWords.filter((item) => item.correctCount >= 3 && item.accuracy >= 70).map((item) => item.normalized));
  const studiedOxfordCount = oxford.filter((item) => studiedSet.has(item.normalized)).length;
  const oxfordCoverage = oxford.length ? Math.round((studiedOxfordCount / oxford.length) * 100) : 0;
  const masteredCount = oxford.filter((item) => masteredSet.has(item.normalized)).length;

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
    weakWordCount: db.weakWords.filter((item) => item.wrongCount > item.correctCount).length,
    reviewReadyCount,
    dailyGoal: db.settings.dailyGoal,
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
  };
}

function getSortedWeakWords(words: WeakWord[]) {
  return [...words].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return +new Date(a.nextReviewAt) - +new Date(b.nextReviewAt);
  });
}
