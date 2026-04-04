import { NextResponse } from 'next/server';
import { getWeakWords } from '@/lib/server/db';

export async function GET() {
  const words = await getWeakWords();
  return NextResponse.json(words);
}
