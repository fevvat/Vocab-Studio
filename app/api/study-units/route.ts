import { NextRequest, NextResponse } from 'next/server';
import { saveStudyUnit, getStudyUnits } from '@/lib/server/db';
import { buildCandidates } from '@/lib/word-pipeline';
import { InputMethod, ParsedWordCandidate } from '@/lib/types';
import { enrichWord } from '@/lib/server/enrich';

export async function GET() {
  const units = await getStudyUnits();
  return NextResponse.json(units);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Yeni Çalışma Birimi';
  const sourceName = typeof body.sourceName === 'string' ? body.sourceName : 'manuel-giris';
  const notes = typeof body.notes === 'string' ? body.notes : '';
  const inputMethod = (typeof body.inputMethod === 'string' ? body.inputMethod : 'text') as InputMethod;
  const rawInput = typeof body.rawInput === 'string' ? body.rawInput : '';
  const providedWords: string[] = Array.isArray(body.words) ? body.words.map((item: unknown) => String(item)) : [];
  const providedCandidates: ParsedWordCandidate[] = Array.isArray(body.candidates) ? body.candidates : [];

  const rawWords = providedCandidates.length
    ? providedCandidates.map((item) => item.suggestion && item.status !== 'confirmed' ? item.suggestion : item.word)
    : providedWords;

  const candidates = buildCandidates(rawWords.join('\n') || rawInput, inputMethod).map((candidate) => {
    const matchingOriginal = providedCandidates.find((item) => item.normalized === candidate.normalized || item.word === candidate.word);
    return matchingOriginal ? {
      ...candidate,
      ...matchingOriginal,
      word: matchingOriginal.suggestion && matchingOriginal.status !== 'confirmed' ? matchingOriginal.suggestion : matchingOriginal.word,
      normalized: (matchingOriginal.suggestion ?? matchingOriginal.word).toLowerCase(),
    } : candidate;
  });

  const finalizedWords = [...new Map(candidates.map((item) => {
    const finalWord = item.suggestion && item.status !== 'confirmed' ? item.suggestion : item.word;
    return [finalWord.toLowerCase(), { ...item, word: finalWord, normalized: finalWord.toLowerCase() }];
  })).values()];

  if (!finalizedWords.length) {
    return NextResponse.json({ message: 'Kelime listesi boş olamaz.' }, { status: 400 });
  }

  const enriched = await Promise.all(finalizedWords.map(async (item) => {
    const meta = await enrichWord(item.word);
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...item,
      word: meta.word,
      normalized: meta.normalized,
      translationTr: meta.translationTr,
      definitionEn: meta.definitionEn,
      example: meta.example,
      exampleTr: meta.exampleTr,
      partOfSpeech: meta.partOfSpeech,
      synonym: meta.synonym,
      antonym: meta.antonym,
      matchedOxford: meta.isOxford3000 || item.matchedOxford,
    };
  }));

  const unit = await saveStudyUnit({
    id: crypto.randomUUID(),
    title,
    sourceName,
    inputMethod,
    notes,
    createdAt: new Date().toISOString(),
    wordCount: enriched.length,
    suspiciousCount: enriched.filter((item) => item.status !== 'confirmed').length,
    words: enriched,
  });

  return NextResponse.json(unit, { status: 201 });
}
