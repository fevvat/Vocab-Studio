import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/server/db';

export async function GET() {
  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
