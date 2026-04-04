import { NextRequest, NextResponse } from 'next/server';
import { getStudyUnit, saveQuiz } from '@/lib/server/db';
import { generateQuiz } from '@/lib/server/quiz-generator';
import { DifficultyLevel, QuestionStyle, QuizMode } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const unitId = String(body.unitId ?? '');
  const style = (body.style ?? 'mixed') as QuestionStyle;
  const mode = (body.mode ?? 'mixed') as QuizMode;
  const difficulty = (body.difficulty ?? 'medium') as DifficultyLevel;
  const questionCount = Number(body.questionCount ?? 12);

  const unit = await getStudyUnit(unitId);
  if (!unit) {
    return NextResponse.json({ message: 'Çalışma birimi bulunamadı.' }, { status: 404 });
  }

  const quiz = await generateQuiz(unit, style, difficulty, questionCount, mode);
  await saveQuiz(quiz);

  return NextResponse.json(quiz, { status: 201 });
}
