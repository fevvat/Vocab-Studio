import { notFound } from 'next/navigation';
import { QuizBuilder } from '@/components/QuizBuilder';
import { SectionCard } from '@/components/SectionCard';
import { getStudyUnit } from '@/lib/server/db';
import { formatDate } from '@/lib/utils';

export default async function StudyUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await getStudyUnit(id);
  if (!unit) notFound();
  const currentUnit = unit;

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Study unit</div>
          <h1>{currentUnit.title}</h1>
          <p>
            {currentUnit.wordCount} kelime • {currentUnit.sourceName} • {formatDate(currentUnit.createdAt)} • giriş: {currentUnit.inputMethod}
            {currentUnit.suspiciousCount ? ` • incelenen kelime: ${currentUnit.suspiciousCount}` : ''}
          </p>
        </div>
      </div>

      <SectionCard title="Quiz oluştur" description="Soru stili, quiz modu ve zorluk seçerek yeni otomatik quiz üret.">
        <QuizBuilder unitId={currentUnit.id} />
      </SectionCard>

      <SectionCard title="Kelime listesi" description="Kaydedilen kelimeler ve yerel sözlük bilgileri">
        <div className="word-grid">
          {currentUnit.words.map((word) => (
            <article key={word.id} className="word-card">
              <div className="chip-row">
                <span className="chip">{word.word}</span>
                {word.level ? <span className="chip">{word.level}</span> : null}
                {word.status !== 'confirmed' ? <span className="chip chip-danger">İncelendi</span> : null}
              </div>
              {word.translationTr ? <p><strong>TR:</strong> {word.translationTr}</p> : null}
              {word.definitionEn ? <p><strong>EN:</strong> {word.definitionEn}</p> : null}
              {word.example ? <p className="muted">{word.example}</p> : null}
            </article>
          ))}
        </div>
      </SectionCard>

      {currentUnit.notes ? (
        <SectionCard title="Not" description="Bu set için küçük açıklama">
          <p>{currentUnit.notes}</p>
        </SectionCard>
      ) : null}
    </div>
  );
}
