import { NextRequest, NextResponse } from 'next/server';
import { applyQuizReflection } from '@/lib/server/db';
import { ReviewSelfRating } from '@/lib/types';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const rating = (body.rating ?? 'okay') as ReviewSelfRating;
  const updated = await applyQuizReflection(id, rating);

  if (!updated) {
    return NextResponse.json({ message: 'Quiz bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
