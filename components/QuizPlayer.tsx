'use client';

import { useMemo, useState } from 'react';
import { Quiz } from '@/lib/types';
import { playAudio } from '@/lib/audio';

export function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const question = quiz.questions[currentIndex];

  const answeredCount = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]).length,
    [selected],
  );

  async function handleSubmit() {
    setSubmitting(true);
    const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: selected }),
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
        <div className="actions-row">
          <h3 style={{ margin: 0 }}>{question.word}</h3>
          <button type="button" className="button" style={{ padding: '6px 10px', borderRadius: '8px' }} title="Kelimeyi Dinle" onClick={() => playAudio(question.word)}>🔊</button>
        </div>
        <p className="muted" style={{ marginTop: '16px' }}>Bu quizde anında açıklamayı açabilir, sonunda tüm sonuçları görebilirsin.</p>
      </div>

      <div className="quiz-card">
        <div className="eyebrow">{question.type.toUpperCase()}</div>
        <h2>{question.prompt}</h2>

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

        <div className="actions-row between">
          <button className="button" onClick={() => setRevealed((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}>
            {revealed[question.id] ? 'Açıklamayı gizle' : 'Açıklamayı göster'}
          </button>
          <div className="actions-row">
            <button className="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((v) => v - 1)}>
              Geri
            </button>
            {currentIndex < quiz.questions.length - 1 ? (
              <button className="button button-primary" onClick={() => setCurrentIndex((v) => v + 1)}>
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
