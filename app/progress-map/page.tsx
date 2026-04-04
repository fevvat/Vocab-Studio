import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getDashboardSummary } from '@/lib/server/db';

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
          <p>Yerel veri seti içindeki coverage, weak ve mastered durumunu seviye bazında takip et.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Toplam yerel Oxford" value={totalOxford} hint="Projede yer alan seed veri seti" icon="📘" />
        <StatCard title="Çalışılan" value={summary.studiedOxfordCount} hint="En az bir kez eklenen kelimeler" icon="✅" />
        <StatCard title="Weak" value={weakTotal} hint="Hâlâ zorlandığın kelimeler" icon="⚠️" />
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
    </div>
  );
}
