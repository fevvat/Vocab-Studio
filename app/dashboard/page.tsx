import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getDashboardSummary } from '@/lib/server/db';
import { formatRelativeDays } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-sm">
          <div className="eyebrow">Learning Insights</div>
          <h1>Performans radarın</h1>
          <p>
            Bu panel günlük hedef, tekrar kuyruğu, zorluk seviyesi ve başarı trendlerini aynı görünümde toplar.
          </p>
          <div className="actions-row">
            <Link href="/settings" className="button button-primary">Ayarları düzenle</Link>
            <Link href="/quiz" className="button">Quiz Lab</Link>
          </div>
          <div className="chip-row">
            <span className="chip">Streak: {summary.streak}</span>
            <span className="chip">Mastered: {summary.masteredCount}</span>
            <span className="chip">Due: {summary.dueTodayCount}</span>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-metric"><strong>{summary.totalWords}</strong><span>Toplam kelime</span></div>
          <div className="hero-metric"><strong>{summary.totalQuizzes}</strong><span>Toplam quiz</span></div>
          <div className="hero-metric"><strong>%{summary.averageAccuracy}</strong><span>Ortalama doğruluk</span></div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard title="Bugün eklenen" value={summary.todayStudiedWords} hint="Gün içi ilerleme" icon="📝" />
        <StatCard title="Goal progress" value={`%${summary.progressToGoal}`} hint={`Hedef: ${summary.dailyGoal}`} icon="📈" />
        <StatCard title="Weak queue" value={summary.weakWordCount} hint="Toplam riskli kelime" icon="🚨" />
        <StatCard title="Coverage" value={`%${summary.oxfordCoverage}`} hint="Oxford kapsamı" icon="🌍" />
      </div>

      <div className="grid-2">
        <SectionCard title="Günlük hedef özeti" description="Hedef ritmini canlı tut">
          <div className="list-stack">
            <div className="list-card static"><strong>Bugün çalışılan</strong><span>{summary.todayStudiedWords}</span></div>
            <div className="list-card static"><strong>Hedef</strong><span>{summary.dailyGoal}</span></div>
            <div className="list-card static"><strong>İlerleme</strong><span>%{summary.progressToGoal}</span></div>
            <Link href="/weak-words" className="list-card">
              <div>
                <strong>Due listesini temizle</strong>
                <p>Bugün tekrar zamanı gelen kelimeleri kapat.</p>
              </div>
              <span>Git →</span>
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="En çok zorlanılanlar" description="Öncelik puanına göre sıralı">
          {summary.mostDifficultWords.length ? (
            <div className="list-stack">
              {summary.mostDifficultWords.map((word) => (
                <div key={word.normalized} className="list-card static">
                  <div>
                    <strong>{word.word}</strong>
                    <p>Yanlış {word.wrongCount} • Doğru {word.correctCount} • Başarı %{word.accuracy}</p>
                  </div>
                  <span>{formatRelativeDays(word.nextReviewAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Zor kelime yok" description="Quiz sonuçların geldikçe burada öncelik listesi oluşur." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
