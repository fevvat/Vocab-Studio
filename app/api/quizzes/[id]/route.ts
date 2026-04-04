import { NextResponse } from 'next/server';
import { getQuiz } from '@/lib/server/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) return NextResponse.json({ message: 'Quiz bulunamadı.' }, { status: 404 });
  return NextResponse.json(quiz);
}
