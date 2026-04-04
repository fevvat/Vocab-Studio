export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionStyle = 'mixed' | 'meaning' | 'context' | 'translation' | 'reverse_translation' | 'spelling';
export type QuizMode = 'mixed' | 'weak_only' | 'new_only' | 'review' | 'mixed_old_new';
export type InputMethod = 'image' | 'text' | 'pdf';
export type CandidateStatus = 'confirmed' | 'suggested' | 'suspicious';

export interface OxfordWord {
  word: string;
  lemma: string;
  normalized: string;
  translationTr: string;
  definitionEn: string;
  partOfSpeech: string;
  level: string;
  example: string;
  exampleTr: string;
  synonym?: string;
  antonym?: string;
  isOxford3000: boolean;
}

export interface ParsedWordCandidate {
  original: string;
  word: string;
  normalized: string;
  status: CandidateStatus;
  confidence: number;
  matchedOxford: boolean;
  suggestion?: string;
  level?: string;
}

export interface WordEntry extends ParsedWordCandidate {
  id: string;
  createdAt: string;
  translationTr?: string;
  definitionEn?: string;
  example?: string;
  exampleTr?: string;
  partOfSpeech?: string;
  synonym?: string;
  antonym?: string;
}

export interface WordMeta {
  word: string;
  normalized: string;
  definitionEn: string;
  translationTr: string;
  example: string;
  exampleTr?: string;
  partOfSpeech: string;
  phonetic: string;
  level?: string;
  synonym?: string;
  antonym?: string;
  isOxford3000: boolean;
  source: 'oxford-local' | 'dictionaryapi' | 'fallback';
}

export interface StudyUnit {
  id: string;
  title: string;
  sourceName: string;
  inputMethod: InputMethod;
  createdAt: string;
  wordCount: number;
  words: WordEntry[];
  notes?: string;
  suspiciousCount?: number;
}

export interface QuizQuestion {
  id: string;
  type: QuestionStyle;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  word: string;
  translationTr?: string;
  example?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  accuracy: number;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    word: string;
  }>;
  wrongWords: string[];
}

export interface Quiz {
  id: string;
  studyUnitId: string;
  createdAt: string;
  style: QuestionStyle;
  mode: QuizMode;
  difficulty: DifficultyLevel;
  questionCount: number;
  questions: QuizQuestion[];
  result?: QuizResult;
}

export interface WeakWord {
  word: string;
  normalized: string;
  wrongCount: number;
  correctCount: number;
  recentFailures: number;
  accuracy: number;
  priority: number;
  lastSeenAt: string;
  nextReviewAt: string;
  reviewInterval: number;
  repetition: number;
  easeFactor: number;
}

export interface Settings {
  dailyGoal: number;
  preferredDifficulty: DifficultyLevel;
  preferredQuestionStyle: QuestionStyle;
  preferredQuizMode: QuizMode;
}

export interface ActivityLogItem {
  id: string;
  type: 'study-unit-created' | 'quiz-completed';
  createdAt: string;
  title: string;
  meta?: Record<string, string | number>;
}

export interface ProgressByLevel {
  level: string;
  studied: number;
  mastered: number;
  weak: number;
  total: number;
}

export interface AppDatabase {
  studyUnits: StudyUnit[];
  quizzes: Quiz[];
  settings: Settings;
  weakWords: WeakWord[];
  activityLog: ActivityLogItem[];
}

export interface DashboardSummary {
  totalUnits: number;
  totalWords: number;
  totalQuizzes: number;
  averageAccuracy: number;
  weakWordCount: number;
  reviewReadyCount: number;
  dailyGoal: number;
  progressToGoal: number;
  recentActivity: ActivityLogItem[];
  latestUnits: StudyUnit[];
  latestQuizzes: Quiz[];
  topWeakWords: WeakWord[];
  streak: number;
  studiedOxfordCount: number;
  oxfordCoverage: number;
  masteredCount: number;
  progressByLevel: ProgressByLevel[];
}
