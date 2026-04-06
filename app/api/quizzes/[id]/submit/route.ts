import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, saveQuizResult } from '@/lib/server/db';

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s]+/g, ' ')
    .replace(/[.,!?;:()[\]{}"']/g, '');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) {
    return NextResponse.json({ message: 'Quiz bulunamadı.' }, { status: 404 });
  }

  const body = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const answers = (body.answers ?? {}) as Record<string, string>;
  const answerMeta = (body.answerMeta ?? {}) as Record<string, { responseTimeMs?: number; confidence?: number }>;

  const resultAnswers = quiz.questions.map((question) => {
    const rawSelected = String(answers[question.id] ?? '').trim();
    const selectedAnswer = rawSelected;

    const exactMatch = selectedAnswer === question.correctAnswer;
    const normalizedMatch = normalizeAnswer(selectedAnswer) === normalizeAnswer(question.correctAnswer);

    const meta = answerMeta[question.id] ?? {};
    const responseTimeMs = Math.max(0, Number(meta.responseTimeMs ?? 0));
    const confidence = Math.min(1, Math.max(0, Number(meta.confidence ?? 0.7)));

    return {
      questionId: question.id,
      selectedAnswer,
      isCorrect: exactMatch || normalizedMatch,
      word: question.word,
      responseTimeMs,
      confidence,
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
