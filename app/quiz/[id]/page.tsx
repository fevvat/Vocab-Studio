import { notFound } from 'next/navigation';
import { QuizPlayer } from '@/components/QuizPlayer';
import { getQuiz } from '@/lib/server/db';
import { titleForQuestionStyle, titleForQuizMode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await getQuiz(id);
  if (!quiz) notFound();
  const currentQuiz = quiz;

  return (
    <div className="stack-xl">
      <div className="page-header">
        <div>
          <div className="eyebrow">Practice mode</div>
          <h1>Quiz çöz</h1>
          <p>{currentQuiz.questionCount} soru • {titleForQuestionStyle(currentQuiz.style)} • {titleForQuizMode(currentQuiz.mode)} • {currentQuiz.difficulty}</p>
        </div>
      </div>
      <QuizPlayer quiz={currentQuiz} />
    </div>
  );
}
