import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getDashboardSummary } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function ProgressMapPage() {
  const summary = await getDashboardSummary();
  const totalOxford = summary.progressByLevel.reduce((sum, item) => sum + item.total, 0);
  const weakTotal = summary.progressByLevel.reduce((sum, item) => sum + item.weak, 0);

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Oxford 3000 progress</div>
          <h1>Oxford ilerleme haritası</h1>
          <p>Yerel katalog içindeki coverage, weak ve mastered durumunu seviye bazında takip et. Oxford dışı kelimeler ayrı sayılır.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Yerel katalog" value={summary.catalogWordCount} hint="Bu sürümde paketlenen Oxford seed veri" icon="📘" />
        <StatCard title="Çalışılan" value={summary.studiedOxfordCount} hint="Katalog içindeki işlenen kelimeler" icon="✅" />
        <StatCard title="Oxford dışı" value={summary.studiedNonOxfordCount} hint="Sistemin işlediği ek kelimeler" icon="➕" />
        <StatCard title="Mastered" value={summary.masteredCount} hint="Doğru oranı yüksek kelimeler" icon="🏆" />
      </div>

      <SectionCard title="Seviye bazlı dağılım" description="A1, A2, B1, B2 görünümü">
        <div className="progress-map-grid">
          {summary.progressByLevel.map((item) => {
            const coverage = item.total ? Math.round((item.studied / item.total) * 100) : 0;
            return (
              <article key={item.level} className="progress-map-card">
                <div className="result-head">
                  <strong>{item.level}</strong>
                  <span>%{coverage}</span>
                </div>
                <div className="progress-bar"><span style={{ width: `${coverage}%` }} /></div>
                <p>Toplam: {item.total}</p>
                <p>Çalışılan: {item.studied}</p>
                <p>Weak: {item.weak}</p>
                <p>Mastered: {item.mastered}</p>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Katalog notu" description="Bu görünüm yerel veri kataloğuna göre hesaplanır">
        <p className="muted">
          Bu sürüm, paket içine gömülü bir Oxford seed kataloğu ile gelir. Oxford dışı ama senin eklediğin kelimeler quiz ve weak-word akışında tam çalışır; sadece seviye haritasında ayrı sayılır.
        </p>
      </SectionCard>
    </div>
  );
}
