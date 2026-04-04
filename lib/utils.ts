import { DifficultyLevel, QuestionStyle, QuizMode } from '@/lib/types';

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatRelativeDays(dateStr: string) {
  const now = Date.now();
  const target = new Date(dateStr).getTime();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Bugün tekrar edilmeli';
  if (diffDays === 1) return 'Yarın tekrar';
  return `${diffDays} gün sonra tekrar`;
}

export function titleForQuestionStyle(type: QuestionStyle) {
  switch (type) {
    case 'meaning':
      return 'Anlam odaklı';
    case 'context':
      return 'Bağlam odaklı';
    case 'translation':
      return 'TR → EN';
    case 'reverse_translation':
      return 'EN → TR';
    case 'spelling':
      return 'Yazım odaklı';
    default:
      return 'Karışık soru seti';
  }
}

export function titleForQuizMode(mode: QuizMode) {
  switch (mode) {
    case 'weak_only':
      return 'Sadece zayıf kelimeler';
    case 'new_only':
      return 'Sadece yeni kelimeler';
    case 'review':
      return 'Bugün tekrar zamanı gelenler';
    case 'mixed_old_new':
      return 'Yeni + zayıf karışık';
    default:
      return 'Karışık tekrar';
  }
}

export function titleForDifficulty(level: DifficultyLevel) {
  switch (level) {
    case 'easy':
      return 'Kolay';
    case 'hard':
      return 'Zor';
    default:
      return 'Orta';
  }
}
