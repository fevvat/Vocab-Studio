import Link from 'next/link';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { getDashboardSummary } from '@/lib/server/db';
import { formatDate } from '@/lib/utils';

export default async function HomePage() {
  const summary = await getDashboardSummary();

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div>
          <div className="eyebrow">Kelime ezberini pasif değil aktif hale getir</div>
          <h1>Görsel, metin veya PDF ile kelime ekle; sistem bunları quiz ve akıllı tekrara dönüştürsün.</h1>
          <p>
            Oxford 3000 çalışırken her 100 kelimelik grubu ayrı bir çalışma birimi olarak kaydet.
            Sistem kelimeleri doğrulasın, şüpheli olanları işaretlesin, yanlış yaptıklarını daha sık geri getirsin.
          </p>
          <div className="actions-row">
            <Link href="/upload" className="button button-primary">Yeni kelime seti ekle</Link>
            <Link href="/progress-map" className="button">Oxford haritasını aç</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-metric"><strong>{summary.totalWords}</strong><span>Toplam kaydedilen kelime</span></div>
          <div className="hero-metric"><strong>%{summary.averageAccuracy}</strong><span>Ortalama quiz doğruluğu</span></div>
          <div className="hero-metric"><strong>{summary.reviewReadyCount}</strong><span>Bugün tekrar bekleyen kelime</span></div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard title="Çalışma birimi" value={summary.totalUnits} hint="Her yükleme ayrı bir öğrenme seti" icon="📚" />
        <StatCard title="Toplam quiz" value={summary.totalQuizzes} hint="Otomatik üretilen ve çözülen quizler" icon="🧠" />
        <StatCard title="Zayıf kelime" value={summary.weakWordCount} hint="Yanlış oranı yüksek kelimeler" icon="🎯" />
        <StatCard title="Oxford kapsama" value={`%${summary.oxfordCoverage}`} hint={`${summary.studiedOxfordCount} kelime işlendi`} icon="🗺️" />
      </div>

      <div className="grid-2">
        <SectionCard title="Son çalışma birimleri" description="Yüklediğin en yeni kelime setleri">
          {summary.latestUnits.length ? (
            <div className="list-stack">
              {summary.latestUnits.map((unit) => (
                <Link href={`/study-units/${unit.id}`} className="list-card" key={unit.id}>
                  <div>
                    <strong>{unit.title}</strong>
                    <p>{unit.wordCount} kelime • {unit.inputMethod} • {formatDate(unit.createdAt)}</p>
                  </div>
                  <span>İncele →</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Henüz çalışma birimi yok" description="İlk görselini, metnini veya PDF’ini yükleyerek sistemi kullanmaya başla." ctaHref="/upload" ctaLabel="Kelime ekle" />
          )}
        </SectionCard>

        <SectionCard title="Son aktiviteler" description="Üretim ve tekrar akışın burada görünür">
          {summary.recentActivity.length ? (
            <div className="timeline">
              {summary.recentActivity.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-dot" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aktivite oluşmadı" description="İlk çalışma birimi ve ilk quiz sonrasında burada bir geçmiş akışı göreceksin." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
