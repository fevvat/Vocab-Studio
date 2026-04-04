import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getWeakWords } from '@/lib/server/db';
import { formatDate, formatRelativeDays } from '@/lib/utils';

export default async function WeakWordsPage() {
  const words = await getWeakWords();

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Adaptive review</div>
          <h1>Zayıf kelimeler</h1>
          <p>Yanlış yaptığın kelimeler burada toplanır. Öncelik puanı ve tekrar tarihi birlikte gösterilir.</p>
        </div>
      </div>

      <SectionCard title="Tekrar listesi" description="Spaced repetition + weak word önceliği">
        {words.length ? (
          <div className="weak-grid">
            {words.map((word) => (
              <article key={word.normalized} className="weak-card">
                <div className="eyebrow">Weak word</div>
                <h3>{word.word}</h3>
                <p>Yanlış: {word.wrongCount} • Doğru: {word.correctCount}</p>
                <p>Başarı: %{word.accuracy} • Son görülme: {formatDate(word.lastSeenAt)}</p>
                <p>Tekrar aralığı: {word.reviewInterval} gün • Ease: {word.easeFactor}</p>
                <p>Öncelik puanı: {word.priority}</p>
                <p className="highlight">{formatRelativeDays(word.nextReviewAt)}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Henüz zayıf kelime oluşmadı" description="Quiz çözdükçe sistem burada kişisel tekrar listeni oluşturacak." />
        )}
      </SectionCard>
    </div>
  );
}
