export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionStyle =
  | 'mixed'
  | 'meaning'
  | 'context'
  | 'translation'
  | 'reverse_translation'
  | 'typed_translation'
  | 'typed_reverse_translation'
  | 'spelling'
  | 'meaning_match'
  | 'example_match'
  | 'synonym'
  | 'antonym'
  | 'sentence_completion'
  | 'typed_sentence_completion';
export type QuizMode = 'mixed' | 'weak_only' | 'new_only' | 'review' | 'mixed_old_new';
export type InputMethod = 'image' | 'text' | 'pdf';
export type CandidateStatus = 'confirmed' | 'suggested' | 'suspicious';
export type ReviewSelfRating = 'easy' | 'okay' | 'hard';

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
  level?: string;
  source?: WordMeta['source'];
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
  source: 'oxford-local' | 'dictionaryapi' | 'fallback' | 'unit-cache';
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
  inputMode?: 'multiple_choice' | 'typed';
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  word: string;
  responseTimeMs?: number;
  confidence?: number;
}

export interface QuizResult {
  score: number;
  total: number;
  accuracy: number;
  submittedAt: string;
  answers: QuizAnswer[];
  wrongWords: string[];
  selfRating?: ReviewSelfRating;
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
  avgResponseTimeMs?: number;
  confidenceScore?: number;
  mastered?: boolean;
  sourceUnitIds?: string[];
}

export interface Settings {
  dailyGoal: number;
  preferredDifficulty: DifficultyLevel;
  preferredQuestionStyle: QuestionStyle;
  preferredQuizMode: QuizMode;
}

export interface ActivityLogItem {
  id: string;
  type: 'study-unit-created' | 'quiz-completed' | 'settings-updated' | 'quiz-reflected';
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

export interface DailyStudyPlan {
  minutes: number;
  weakDueWords: string[];
  reinforcementWords: string[];
  newWords: string[];
  recommendedModes: QuizMode[];
}

export interface DashboardSummary {
  totalUnits: number;
  totalWords: number;
  totalQuizzes: number;
  averageAccuracy: number;
  weakWordCount: number;
  reviewReadyCount: number;
  dueTodayCount: number;
  dailyGoal: number;
  todayStudiedWords: number;
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
  mostDifficultWords: WeakWord[];
  catalogWordCount: number;
  studiedNonOxfordCount: number;
}
