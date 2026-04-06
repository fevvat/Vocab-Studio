import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuizBuilder } from '@/components/QuizBuilder';
import { SectionCard } from '@/components/SectionCard';
import { getSettings, getStudyUnit } from '@/lib/server/db';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudyUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [unit, settings] = await Promise.all([getStudyUnit(id), getSettings()]);
  if (!unit) notFound();

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-sm">
          <div className="eyebrow">Unit Console</div>
          <h1>{unit.title}</h1>
          <p>
            {unit.wordCount} kelime • {unit.sourceName} • {formatDate(unit.createdAt)} • giriş: {unit.inputMethod}
            {unit.suspiciousCount ? ` • inceleme: ${unit.suspiciousCount}` : ''}
          </p>
          <div className="actions-row">
            <Link href="/quiz" className="button button-primary">Quiz Lab</Link>
            <Link href="/history" className="button">Arşive dön</Link>
            <Link href="/weak-words" className="button">Recovery</Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-metric"><strong>{unit.wordCount}</strong><span>Toplam kelime</span></div>
          <div className="hero-metric"><strong>{unit.inputMethod}</strong><span>Girdi kaynağı</span></div>
          <div className="hero-metric"><strong>{unit.suspiciousCount ?? 0}</strong><span>İnceleme adedi</span></div>
        </div>
      </section>

      <SectionCard title="Quiz üretim stüdyosu" description="Bu set için mod, zorluk ve soru stilini seçerek quiz oluştur.">
        <QuizBuilder unitId={unit.id} defaults={settings} />
      </SectionCard>

      <SectionCard title="Kelime envanteri" description="Sözlük detayları ile setteki tüm kelimeler">
        <div className="word-grid">
          {unit.words.map((word) => (
            <article key={word.id} className="word-card">
              <div className="chip-row">
                <span className="chip">{word.word}</span>
                {word.level ? <span className="chip">{word.level}</span> : null}
                {word.status !== 'confirmed' ? <span className="chip chip-danger">İnceleme</span> : null}
                {word.source ? <span className="chip">{word.source}</span> : null}
              </div>
              {word.translationTr ? <p><strong>TR:</strong> {word.translationTr}</p> : null}
              {word.definitionEn ? <p><strong>EN:</strong> {word.definitionEn}</p> : null}
              {word.example ? <p className="muted">{word.example}</p> : null}
            </article>
          ))}
        </div>
      </SectionCard>

      {unit.notes ? (
        <SectionCard title="Set notu" description="Bu çalışma birimine ait açıklama">
          <p>{unit.notes}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}
