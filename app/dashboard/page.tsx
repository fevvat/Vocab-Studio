import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getDashboardSummary } from '@/lib/server/db';
import { formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Progress dashboard</div>
          <h1>Öğrenme paneli</h1>
          <p>Kelime setlerin, Oxford 3000 kapsama alanın, zayıf kelimelerin ve tekrar zamanı gelen kelimelerin tek bir yerde.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Toplam kelime" value={summary.totalWords} hint="Yüklenen tüm birimler" icon="🗂️" />
        <StatCard title="Quiz doğruluğu" value={`%${summary.averageAccuracy}`} hint="Tamamlanan quizlerin ortalaması" icon="✅" />
        <StatCard title="Tekrar hazır" value={summary.reviewReadyCount} hint="Bugün tekrar göstermen gereken kelimeler" icon="⏰" />
        <StatCard title="Streak" value={summary.streak} hint="Aralıksız çalışma günü" icon="🔥" />
      </div>

      <div className="grid-2">
        <SectionCard title="Oxford 3000 ilerleme özeti" description="Yerel veri seti içinde ne kadar yol aldığını gör">
          <div className="list-stack">
            <div className="list-card static"><strong>Çalışılan Oxford kelimesi</strong><span>{summary.studiedOxfordCount}</span></div>
            <div className="list-card static"><strong>Kapsama oranı</strong><span>%{summary.oxfordCoverage}</span></div>
            <div className="list-card static"><strong>Mastered sayısı</strong><span>{summary.masteredCount}</span></div>
            <Link href="/progress-map" className="list-card">
              <div>
                <strong>Detaylı ilerleme haritasını aç</strong>
                <p>Seviye bazlı dağılım ve studied / weak / mastered görünümü</p>
              </div>
              <span>Git →</span>
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="En zayıf kelimeler" description="Yanlış oranı yüksek veya tekrar zamanı gelenler">
          {summary.topWeakWords.length ? (
            <div className="list-stack">
              {summary.topWeakWords.map((word) => (
                <div key={word.normalized} className="list-card static">
                  <div>
                    <strong>{word.word}</strong>
                    <p>Yanlış: {word.wrongCount} • Doğru: {word.correctCount} • Başarı: %{word.accuracy}</p>
                  </div>
                  <span>{formatDate(word.nextReviewAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Zayıf kelime listesi boş" description="Quiz çözdükçe sistem burada zorlandığın kelimeleri göstermeye başlar." />
          )}
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard title="Seviye dağılımı" description="A1, A2, B1, B2 bazında durum">
          <div className="list-stack">
            {summary.progressByLevel.map((item) => (
              <div key={item.level} className="list-card static">
                <div>
                  <strong>{item.level}</strong>
                  <p>Çalışılan: {item.studied} • Weak: {item.weak} • Mastered: {item.mastered}</p>
                </div>
                <span>{item.total}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Son quizler" description="Son oluşturulan veya çözülen quizler">
          {summary.latestQuizzes.length ? (
            <div className="list-stack">
              {summary.latestQuizzes.map((quiz) => (
                <div key={quiz.id} className="list-card static">
                  <div>
                    <strong>{quiz.questionCount} soruluk quiz</strong>
                    <p>{quiz.style} • {quiz.mode} • {formatDate(quiz.createdAt)}</p>
                  </div>
                  <span>{quiz.result ? `%${quiz.result.accuracy}` : 'Bekliyor'}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Quiz henüz yok" description="Bir çalışma birimine girip quiz oluşturduğunda burada görünür." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
