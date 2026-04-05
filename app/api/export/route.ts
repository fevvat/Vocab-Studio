import { NextResponse } from 'next/server';
import { readDb } from '@/lib/server/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get('format') || 'json';

  const db = await readDb();

  if (format === 'csv') {
    // Anki için sade format: Kelime, Çeviri, Örnek
    // Tüm çalışılan, sözlükte geçmiş kelimeleri çekelim veya study unitlerin tamamını
    const allWordsMap = new Map();
    db.studyUnits.forEach(unit => {
      unit.words.forEach(w => {
        if (!allWordsMap.has(w.normalized)) {
          allWordsMap.set(w.normalized, w);
        }
      });
    });

    let csv = 'Word,Status\n';
    allWordsMap.forEach(v => {
      csv += `${v.word},${v.status}\n`; // Eğer enrich edilmişse translationTr konabilir
    });

    // Zayıf kelimelerde daha çok detay var, onu ekleyelim:
    let weakCsv = 'Word,Correct,Wrong,Accuracy\n';
    db.weakWords.forEach(v => {
      weakCsv += `${v.word},${v.correctCount},${v.wrongCount},%${v.accuracy}\n`;
    });

    return new NextResponse(weakCsv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="ankideck-weakwords.csv"'
      }
    });
  }

  // JSON yedek
  return NextResponse.json(db, {
    headers: {
       'Content-Type': 'application/json',
       'Content-Disposition': 'attachment; filename="vocab-studio-backup.json"'
    }
  });
}
