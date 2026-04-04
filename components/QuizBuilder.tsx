'use client';

import { useState } from 'react';
import { DifficultyLevel, QuestionStyle, QuizMode } from '@/lib/types';

export function QuizBuilder({ unitId }: { unitId: string }) {
  const [style, setStyle] = useState<QuestionStyle>('mixed');
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, style, mode, difficulty, questionCount }),
      });

      if (!response.ok) throw new Error('Quiz üretilemedi');
      const data = await response.json();
      window.location.href = `/quiz/${data.id}`;
    } catch (err) {
      console.error(err);
      setError('Quiz oluşturulamadı. Birimin içeriğini ve internet bağlantını kontrol et.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-grid-3">
      <label>
        <span>Soru stili</span>
        <select value={style} onChange={(e: any) => setStyle(e.target.value as QuestionStyle)} className="input">
          <option value="mixed">Karışık</option>
          <option value="meaning">Anlam</option>
          <option value="context">Bağlam</option>
          <option value="translation">TR → EN</option>
          <option value="reverse_translation">EN → TR</option>
          <option value="spelling">Yazım</option>
        </select>
      </label>

      <label>
        <span>Quiz modu</span>
        <select value={mode} onChange={(e: any) => setMode(e.target.value as QuizMode)} className="input">
          <option value="mixed">Karışık tekrar</option>
          <option value="weak_only">Sadece zayıf kelimeler</option>
          <option value="new_only">Sadece yeni kelimeler</option>
          <option value="review">Bugün tekrar zamanı gelenler</option>
          <option value="mixed_old_new">Yeni + zayıf karışık</option>
        </select>
      </label>

      <label>
        <span>Zorluk</span>
        <select value={difficulty} onChange={(e: any) => setDifficulty(e.target.value as DifficultyLevel)} className="input">
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
      </label>

      <label className="span-full">
        <span>Soru sayısı</span>
        <input
          type="number"
          min={5}
          max={30}
          value={questionCount}
          onChange={(e: any) => setQuestionCount(Number(e.target.value))}
          className="input"
        />
      </label>

      <div className="actions-row span-full">
        <button className="button button-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Quiz hazırlanıyor...' : 'Quiz oluştur'}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
