import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, saveQuizResult } from '@/lib/server/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) {
    return NextResponse.json({ message: 'Quiz bulunamadı.' }, { status: 404 });
  }

  const body = await request.json();
  const answers = (body.answers ?? {}) as Record<string, string>;

  const resultAnswers = quiz.questions.map((question) => {
    const selectedAnswer = answers[question.id] ?? '';
    return {
      questionId: question.id,
      selectedAnswer,
      isCorrect: selectedAnswer === question.correctAnswer,
      word: question.word,
    };
  });

  const score = resultAnswers.filter((answer) => answer.isCorrect).length;
  const total = quiz.questions.length;
  const wrongWords = resultAnswers.filter((answer) => !answer.isCorrect).map((answer) => answer.word);

  const result = {
    score,
    total,
    accuracy: Math.round((score / Math.max(total, 1)) * 100),
    submittedAt: new Date().toISOString(),
    answers: resultAnswers,
    wrongWords,
  };

  const updatedQuiz = await saveQuizResult(id, result);
  return NextResponse.json(updatedQuiz);
}
