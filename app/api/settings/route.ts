import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/server/db';
import { DifficultyLevel, QuestionStyle, QuizMode } from '@/lib/types';

const ALLOWED_STYLES = new Set<QuestionStyle>([
  'mixed',
  'meaning',
  'context',
  'translation',
  'reverse_translation',
  'typed_translation',
  'typed_reverse_translation',
  'spelling',
  'meaning_match',
  'example_match',
  'synonym',
  'antonym',
  'sentence_completion',
  'typed_sentence_completion',
]);
const ALLOWED_MODES = new Set<QuizMode>(['mixed', 'weak_only', 'new_only', 'review', 'mixed_old_new']);
const ALLOWED_DIFFICULTIES = new Set<DifficultyLevel>(['easy', 'medium', 'hard']);

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const dailyGoal = Math.min(2000, Math.max(5, Number(body.dailyGoal ?? 100)));
  const preferredDifficulty = String(body.preferredDifficulty ?? 'medium') as DifficultyLevel;
  const preferredQuestionStyle = String(body.preferredQuestionStyle ?? 'mixed') as QuestionStyle;
  const preferredQuizMode = String(body.preferredQuizMode ?? 'mixed') as QuizMode;

  if (!ALLOWED_DIFFICULTIES.has(preferredDifficulty)) {
    return NextResponse.json({ message: 'Geçersiz zorluk seviyesi.' }, { status: 400 });
  }
  if (!ALLOWED_STYLES.has(preferredQuestionStyle)) {
    return NextResponse.json({ message: 'Geçersiz soru stili.' }, { status: 400 });
  }
  if (!ALLOWED_MODES.has(preferredQuizMode)) {
    return NextResponse.json({ message: 'Geçersiz quiz modu.' }, { status: 400 });
  }

  const settings = await saveSettings({
    dailyGoal,
    preferredDifficulty,
    preferredQuestionStyle,
    preferredQuizMode,
  });
  return NextResponse.json(settings);
}
