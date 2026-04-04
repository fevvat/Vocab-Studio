import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { StatCard } from '@/components/StatCard';
import { getQuiz } from '@/lib/server/db';
import { titleForQuestionStyle, titleForQuizMode } from '@/lib/utils';

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz || !quiz.result) notFound();
  const currentQuiz = quiz;
  const currentResult = currentQuiz.result!;

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Results</div>
          <h1>Quiz sonucu</h1>
          <p>{titleForQuestionStyle(currentQuiz.style)} • {titleForQuizMode(currentQuiz.mode)} • {currentQuiz.difficulty}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Skor" value={`${currentResult.score}/${currentResult.total}`} hint="Toplam doğru sayın" icon="🏁" />
        <StatCard title="Doğruluk" value={`%${currentResult.accuracy}`} hint="Bu quiz için başarı oranı" icon="🎯" />
        <StatCard title="Yanlış kelime" value={currentResult.wrongWords.length} hint="Tekrara düşen kelimeler" icon="🔁" />
        <StatCard title="Quiz modu" value={titleForQuizMode(currentQuiz.mode)} hint="Seçtiğin çalışma modu" icon="🧩" />
      </div>

      <div className="grid-2">
        <SectionCard title="Yanlış yaptığın kelimeler" description="Bu kelimeler weak word listene işlendi">
          {currentResult.wrongWords.length ? (
            <div className="chip-row large-gap">
              {currentResult.wrongWords.map((word) => (
                <span key={word} className="chip chip-danger">{word}</span>
              ))}
            </div>
          ) : (
            <EmptyState title="Harika iş" description="Bu quizde yanlış yaptığın kelime yok." />
          )}
        </SectionCard>

        <SectionCard title="Sonraki adımlar" description="Öğrenmeyi kalıcı hale getirmek için">
          <div className="list-stack">
            <Link href="/weak-words" className="list-card">
              <div>
                <strong>Zayıf kelimeleri incele</strong>
                <p>Yanlışların tekrar planına eklenmiş durumda.</p>
              </div>
              <span>Git →</span>
            </Link>
            <Link href={`/study-units/${currentQuiz.studyUnitId}`} className="list-card">
              <div>
                <strong>Aynı setten yeni quiz üret</strong>
                <p>Farklı mod veya farklı zorlukla tekrar yap.</p>
              </div>
              <span>Git →</span>
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Soru bazlı özet" description="Açıklamalarla birlikte cevapların">
        <div className="list-stack">
          {currentQuiz.questions.map((question) => {
            const answer = currentResult.answers.find((item) => item.questionId === question.id);
            return (
              <div key={question.id} className="result-card">
                <div className="result-head">
                  <strong>{question.prompt}</strong>
                  <span className={answer?.isCorrect ? 'badge-success' : 'badge-danger'}>
                    {answer?.isCorrect ? 'Doğru' : 'Yanlış'}
                  </span>
                </div>
                <p><strong>Senin cevabın:</strong> {answer?.selectedAnswer ?? 'Boş bırakıldı'}</p>
                <p><strong>Doğru cevap:</strong> {question.correctAnswer}</p>
                <p>{question.explanation}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
