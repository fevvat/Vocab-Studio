'use client';

import { useState } from 'react';
import { ReviewSelfRating } from '@/lib/types';

export function ResultReflection({ quizId, initial }: { quizId: string; initial?: ReviewSelfRating }) {
  const [selected, setSelected] = useState<ReviewSelfRating | undefined>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(initial ? 'Bu quiz için bir öz değerlendirme kaydedildi.' : '');

  async function handleRate(rating: ReviewSelfRating) {
    setSaving(true);
    setSelected(rating);
    const response = await fetch(`/api/quizzes/${quizId}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });

    setMessage(response.ok ? 'Öz değerlendirmen kaydedildi. Review planı güncellendi.' : 'Öz değerlendirme kaydedilemedi.');
    setSaving(false);
  }

  return (
    <div className="stack-sm">
      <div className="actions-row wrap-actions">
        {(['easy', 'okay', 'hard'] as ReviewSelfRating[]).map((rating) => (
          <button
            key={rating}
            type="button"
            className={`button ${selected === rating ? 'button-primary' : ''}`}
            disabled={saving}
            onClick={() => handleRate(rating)}
          >
            {rating === 'easy' ? 'Kolaydı' : rating === 'okay' ? 'İdare eder' : 'Zorlandım'}
          </button>
        ))}
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
