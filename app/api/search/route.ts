import { NextResponse } from 'next/server';
import { findOxfordWord } from '@/lib/server/oxford';
import { enrichWord } from '@/lib/server/enrich';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').toLowerCase().trim();

  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 });

  // Sözlükte var mı bakalım, yoksa bile enrich yardımıyla çeviri bulup döndürelim
  try {
    const meta = await enrichWord(q);
    return NextResponse.json(meta);
  } catch (err) {
    return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  }
}
