import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getDashboardSummary } from '@/lib/server/db';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const summary = await getDashboardSummary();

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-sm">
          <div className="eyebrow">Study Workspace</div>
          <h1>Tek panelden günlük öğrenme operasyonu</h1>
          <p>
            Bu yeni arayüz veri odaklı bir çalışma döngüsü sunar: set seç, quiz üret, zayıf kelimeleri temizle,
            performansı dashboard ile kontrol et.
          </p>
          <div className="actions-row">
            <Link href="/quiz" className="button button-primary">Quiz Lab aç</Link>
            <Link href="/weak-words" className="button">Recovery listesi</Link>
            <Link href="/dashboard" className="button">Insights</Link>
          </div>
          <div className="chip-row">
            <span className="chip">Set: {summary.totalUnits}</span>
            <span className="chip">Quiz: {summary.totalQuizzes}</span>
            <span className="chip">Streak: {summary.streak} gün</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-metric">
            <strong>{summary.todayStudiedWords}</strong>
            <span>Bugün işlenen kelime</span>
          </div>
          <div className="hero-metric">
            <strong>{summary.reviewReadyCount}</strong>
            <span>Hazır review adedi</span>
          </div>
          <div className="hero-metric">
            <strong>%{summary.averageAccuracy}</strong>
            <span>Ortalama quiz başarısı</span>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard title="Günlük hedef" value={`%${summary.progressToGoal}`} hint={`${summary.todayStudiedWords}/${summary.dailyGoal} kelime`} icon="🎯" />
        <StatCard title="Due today" value={summary.dueTodayCount} hint="Öncelikli review" icon="🕒" />
        <StatCard title="Weak words" value={summary.weakWordCount} hint="Riskli kelime havuzu" icon="🧩" />
        <StatCard title="Oxford coverage" value={`%${summary.oxfordCoverage}`} hint={`${summary.studiedOxfordCount} kelime`} icon="🗂️" />
      </div>

      <div className="grid-2">
        <SectionCard title="Bugünkü rota" description="Kısa ve net çalışma akışı">
          <div className="list-stack">
            <Link href="/quiz" className="list-card">
              <div>
                <strong>1) Quiz Lab</strong>
                <p>Aktif setten yeni test üret veya bekleyen quizi tamamla.</p>
              </div>
              <span>Başlat →</span>
            </Link>
            <Link href="/weak-words" className="list-card">
              <div>
                <strong>2) Recovery</strong>
                <p>Due olan weak kelimeleri hızlı tekrar ile azalt.</p>
              </div>
              <span>Temizle →</span>
            </Link>
            <Link href="/ai-coach" className="list-card">
              <div>
                <strong>3) Coach Plan</strong>
                <p>Başarı trendine göre sonraki oturum önerisi al.</p>
              </div>
              <span>Planla →</span>
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Son birimler" description="Yüklediğin en güncel setler">
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
            <EmptyState title="Henüz set yok" description="İlk seti yükleyerek çalışma akışını başlat." ctaHref="/upload" ctaLabel="Set yükle" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
