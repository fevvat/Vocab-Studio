import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getWeakWords } from '@/lib/server/db';
import { formatDate, formatRelativeDays } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function WeakWordsPage() {
  const [words, dueWords] = await Promise.all([getWeakWords(), getWeakWords({ dueOnly: true })]);

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-sm">
          <div className="eyebrow">Recovery Zone</div>
          <h1>Zayıf kelime operasyon paneli</h1>
          <p>
            Bu görünümde öncelik puanı ve tekrar tarihi öne çıkar. Önce due kuyruğunu temizleyip sonra düşük başarı
            oranlı kelimelere geç.
          </p>
          <div className="actions-row">
            <Link href="/quiz" className="button button-primary">Tekrar quizi başlat</Link>
            <Link href="/ai-coach" className="button">Coach önerisi</Link>
          </div>
          <div className="chip-row">
            <span className="chip">Due: {dueWords.length}</span>
            <span className="chip">Toplam weak: {words.length}</span>
            <span className="chip">Önce due → sonra reinforcement</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-metric"><strong>{dueWords.length}</strong><span>Bugün due</span></div>
          <div className="hero-metric"><strong>{words.length}</strong><span>Weak havuzu</span></div>
          <div className="hero-metric"><strong>{words.length ? `%${Math.round(words.reduce((sum, item) => sum + item.accuracy, 0) / words.length)}` : '%0'}</strong><span>Ort. başarı</span></div>
        </div>
      </section>

      <SectionCard title="Acil tekrar listesi" description="Önce bunları tamamla">
        {dueWords.length ? (
          <div className="chip-row large-gap">
            {dueWords.slice(0, 30).map((word) => (
              <span key={word.normalized} className="chip chip-danger">{word.word}</span>
            ))}
          </div>
        ) : (
          <EmptyState title="Due kelime yok" description="Bugünkü review kuyruğu temiz görünüyor." />
        )}
      </SectionCard>

      <SectionCard title="Tüm weak kayıtları" description="Öncelik ve tarih bilgisiyle detaylı liste">
        {words.length ? (
          <div className="weak-grid">
            {words.map((word) => (
              <article key={word.normalized} className="weak-card">
                <div className="eyebrow">Weak entry</div>
                <h3>{word.word}</h3>
                <p>Yanlış: {word.wrongCount} • Doğru: {word.correctCount}</p>
                <p>Başarı: %{word.accuracy} • Son görülme: {formatDate(word.lastSeenAt)}</p>
                <p>Aralık: {word.reviewInterval} gün • Ease: {word.easeFactor}</p>
                <p>Öncelik: {word.priority}</p>
                <p className="highlight">{formatRelativeDays(word.nextReviewAt)}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Weak liste boş" description="Quiz sonuçlarına göre burada kişisel tekrar listesi oluşur." />
        )}
      </SectionCard>
    </div>
  );
}
