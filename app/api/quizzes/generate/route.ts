import { NextRequest, NextResponse } from 'next/server';
import { getStudyUnit, saveQuiz } from '@/lib/server/db';
import { generateQuiz } from '@/lib/server/quiz-generator';
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

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const unitId = String(body.unitId ?? '').trim();
  if (!unitId) {
    return NextResponse.json({ message: 'unitId zorunludur.' }, { status: 400 });
  }

  const style = String(body.style ?? 'mixed') as QuestionStyle;
  const mode = String(body.mode ?? 'mixed') as QuizMode;
  const difficulty = String(body.difficulty ?? 'medium') as DifficultyLevel;
  const questionCount = Math.min(40, Math.max(5, Number(body.questionCount ?? 12)));

  if (!ALLOWED_STYLES.has(style)) {
    return NextResponse.json({ message: 'Geçersiz soru stili.' }, { status: 400 });
  }
  if (!ALLOWED_MODES.has(mode)) {
    return NextResponse.json({ message: 'Geçersiz quiz modu.' }, { status: 400 });
  }
  if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
    return NextResponse.json({ message: 'Geçersiz zorluk seviyesi.' }, { status: 400 });
  }

  const unit = await getStudyUnit(unitId);
  if (!unit) {
    return NextResponse.json({ message: 'Çalışma birimi bulunamadı.' }, { status: 404 });
  }

  const quiz = await generateQuiz(unit, style, difficulty, questionCount, mode);
  await saveQuiz(quiz);

  return NextResponse.json(quiz, { status: 201 });
}
