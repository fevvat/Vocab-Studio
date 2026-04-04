import Link from 'next/link';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getQuizzes, getStudyUnits } from '@/lib/server/db';
import { formatDate, titleForQuestionStyle, titleForQuizMode } from '@/lib/utils';

export default async function HistoryPage() {
  const [units, quizzes] = await Promise.all([getStudyUnits(), getQuizzes()]);

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">History</div>
          <h1>Çalışma geçmişi</h1>
          <p>Tüm yüklemeler ve oluşturduğun quizlerin zaman çizelgesi.</p>
        </div>
      </div>

      <div className="grid-2">
        <SectionCard title="Çalışma birimleri" description="Eski setlerine dön ve yeniden quiz üret">
          {units.length ? (
            <div className="list-stack">
              {units.map((unit) => (
                <Link href={`/study-units/${unit.id}`} key={unit.id} className="list-card">
                  <div>
                    <strong>{unit.title}</strong>
                    <p>{unit.wordCount} kelime • {unit.inputMethod} • {formatDate(unit.createdAt)}</p>
                  </div>
                  <span>Git →</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Kayıtlı birim yok" description="Önce bir kelime seti kaydetmelisin." ctaHref="/upload" ctaLabel="Kelime yükle" />
          )}
        </SectionCard>

        <SectionCard title="Quiz geçmişi" description="Tamamlanan ve bekleyen quizler">
          {quizzes.length ? (
            <div className="list-stack">
              {quizzes.map((quiz) => (
                <Link href={quiz.result ? `/results/${quiz.id}` : `/quiz/${quiz.id}`} key={quiz.id} className="list-card">
                  <div>
                    <strong>{titleForQuestionStyle(quiz.style)} • {quiz.questionCount} soru</strong>
                    <p>{formatDate(quiz.createdAt)} • {titleForQuizMode(quiz.mode)}</p>
                  </div>
                  <span>{quiz.result ? `%${quiz.result.accuracy}` : 'Devam et'}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Quiz geçmişi boş" description="İlk quizini oluşturunca burada listelenecek." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
