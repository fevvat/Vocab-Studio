import { NextResponse } from 'next/server';
import { getStudyUnit } from '@/lib/server/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await getStudyUnit(id);
  if (!unit) {
    return NextResponse.json({ message: 'Çalışma birimi bulunamadı.' }, { status: 404 });
  }
  return NextResponse.json(unit);
}
