import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getQuizzes, getStudyUnits } from '@/lib/server/db';
import { formatDate, titleForQuestionStyle, titleForQuizMode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const [units, quizzes] = await Promise.all([getStudyUnits(), getQuizzes()]);

  return (
    <div className="stack-xl">
      <section className="hero-card">
        <div className="stack-sm">
          <div className="eyebrow">Archive</div>
          <h1>Çalışma geçmişi arşivi</h1>
          <p>Eski setleri ve quiz sonuçlarını tek panelde aç, karşılaştır ve yeniden çalıştır.</p>
          <div className="actions-row">
            <Link href="/upload" className="button button-primary">Yeni set içe aktar</Link>
            <Link href="/quiz" className="button">Quiz Lab</Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-metric"><strong>{units.length}</strong><span>Toplam set</span></div>
          <div className="hero-metric"><strong>{quizzes.length}</strong><span>Toplam quiz</span></div>
          <div className="hero-metric"><strong>{quizzes.filter((quiz) => quiz.result).length}</strong><span>Tamamlanan</span></div>
        </div>
      </section>

      <div className="grid-2">
        <SectionCard title="Set geçmişi" description="Önceki birimlerine geri dön">
          {units.length ? (
            <div className="list-stack">
              {units.map((unit) => (
                <Link href={`/study-units/${unit.id}`} key={unit.id} className="list-card">
                  <div>
                    <strong>{unit.title}</strong>
                    <p>{unit.wordCount} kelime • {unit.inputMethod} • {formatDate(unit.createdAt)}</p>
                  </div>
                  <span>Aç →</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Set kaydı yok" description="İlk çalışma birimini yükleyince burada listelenecek." ctaHref="/upload" ctaLabel="Set yükle" />
          )}
        </SectionCard>

        <SectionCard title="Quiz kayıtları" description="Çözülmüş ve bekleyen quizler">
          {quizzes.length ? (
            <div className="list-stack">
              {quizzes.map((quiz) => (
                <Link href={quiz.result ? `/results/${quiz.id}` : `/quiz/${quiz.id}`} key={quiz.id} className="list-card">
                  <div>
                    <strong>{quiz.questionCount} soruluk quiz</strong>
                    <p>{titleForQuestionStyle(quiz.style)} • {titleForQuizMode(quiz.mode)} • {formatDate(quiz.createdAt)}</p>
                  </div>
                  <span className={quiz.result ? 'badge-success' : 'chip'}>{quiz.result ? `%${quiz.result.accuracy}` : 'Devam et'}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Quiz geçmişi boş" description="Quiz oluşturduğunda tüm kayıtlar burada tutulur." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
