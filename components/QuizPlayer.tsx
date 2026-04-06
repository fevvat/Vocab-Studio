'use client';

import { useMemo, useState } from 'react';
import { Quiz } from '@/lib/types';
import { titleForQuestionStyle } from '@/lib/utils';

export function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const firstQuestionId = quiz.questions[0]?.id;
  const [seenAt, setSeenAt] = useState<Record<string, number>>(firstQuestionId ? { [firstQuestionId]: Date.now() } : {});
  const [submitting, setSubmitting] = useState(false);
  const question = quiz.questions[currentIndex];
  const isTyped = question.inputMode === 'typed' || !question.options.length;

  const answeredCount = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]).length,
    [selected],
  );

  async function handleSubmit() {
    setSubmitting(true);
    const answerMeta = Object.fromEntries(
      quiz.questions.map((item) => {
        const started = seenAt[item.id] ?? Date.now();
        return [item.id, {
          responseTimeMs: Math.max(0, Date.now() - started),
          confidence: Math.min(1, Math.max(0, confidence[item.id] ?? 0.7)),
        }];
      }),
    );

    const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: selected, answerMeta }),
    });

    if (response.ok) {
      window.location.href = `/results/${quiz.id}`;
      return;
    }

    setSubmitting(false);
    alert('Quiz gönderilemedi.');
  }

  return (
    <div className="quiz-layout">
      <div className="quiz-progress-card">
        <div className="progress-bar"><span style={{ width: `${Math.round((answeredCount / quiz.questions.length) * 100)}%` }} /></div>
        <p>{currentIndex + 1}. soru / {quiz.questions.length}</p>
        <h3>{question.word}</h3>
        <p className="muted">Bu quizde anında açıklamayı açabilir, sonunda tüm sonuçları görebilirsin.</p>
      </div>

      <div className="quiz-card">
        <div className="eyebrow">{titleForQuestionStyle(question.type)}</div>
        <h2>{question.prompt}</h2>

        {isTyped ? (
          <div className="stack-sm">
            <input
              className="input"
              value={selected[question.id] ?? ''}
              onChange={(e: any) => setSelected((prev) => ({ ...prev, [question.id]: e.target.value }))}
              placeholder="Cevabını yaz"
            />
          </div>
        ) : (
          <div className="options-grid">
            {question.options.map((option) => {
              const isSelected = selected[question.id] === option;
              const isRevealed = revealed[question.id];
              const isCorrect = question.correctAnswer === option;
              return (
                <button
                  key={option}
                  className={`option-card ${isSelected ? 'option-selected' : ''} ${isRevealed && isCorrect ? 'option-correct' : ''}`}
                  onClick={() => setSelected((prev) => ({ ...prev, [question.id]: option }))}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        <label className="label-block">
          <span>Cevabından ne kadar eminsin? (%{Math.round((confidence[question.id] ?? 0.7) * 100)})</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={confidence[question.id] ?? 0.7}
            onChange={(e: any) => setConfidence((prev) => ({ ...prev, [question.id]: Number(e.target.value) }))}
          />
        </label>

        <div className="actions-row between">
          <button className="button" onClick={() => setRevealed((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}>
            {revealed[question.id] ? 'Açıklamayı gizle' : 'Açıklamayı göster'}
          </button>
          <div className="actions-row">
            <button className="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((v) => v - 1)}>
              Geri
            </button>
            {currentIndex < quiz.questions.length - 1 ? (
              <button
                className="button button-primary"
                onClick={() => {
                  const nextIndex = currentIndex + 1;
                  const nextQuestion = quiz.questions[nextIndex];
                  if (nextQuestion && !seenAt[nextQuestion.id]) {
                    setSeenAt((prev) => ({ ...prev, [nextQuestion.id]: Date.now() }));
                  }
                  setCurrentIndex(nextIndex);
                }}
              >
                İleri
              </button>
            ) : (
              <button className="button button-primary" onClick={handleSubmit} disabled={submitting || answeredCount !== quiz.questions.length}>
                {submitting ? 'Gönderiliyor...' : 'Quizi bitir'}
              </button>
            )}
          </div>
        </div>

        {revealed[question.id] ? (
          <div className="explanation-box">
            <strong>Doğru cevap:</strong> {question.correctAnswer}
            <p>{question.explanation}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
