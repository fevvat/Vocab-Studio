'use client';

import { useState } from 'react';
import { Settings } from '@/lib/types';

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setMessage('Ayarlar kaydedildi. Yeni quizlerde bu varsayılanlar kullanılacak.');
    } else {
      setMessage('Ayarlar kaydedilemedi.');
    }
    setSaving(false);
  }

  return (
    <div className="settings-grid">
      <label className="setting-card">
        <strong>Günlük hedef</strong>
        <input
          type="number"
          min={10}
          max={1000}
          value={form.dailyGoal}
          onChange={(e: any) => setForm((prev) => ({ ...prev, dailyGoal: Number(e.target.value) || 0 }))}
          className="input"
        />
      </label>

      <label className="setting-card">
        <strong>Varsayılan zorluk</strong>
        <select
          value={form.preferredDifficulty}
          onChange={(e: any) => setForm((prev) => ({ ...prev, preferredDifficulty: e.target.value }))}
          className="input"
        >
          <option value="easy">Kolay</option>
          <option value="medium">Orta</option>
          <option value="hard">Zor</option>
        </select>
      </label>

      <label className="setting-card">
        <strong>Varsayılan soru stili</strong>
        <select
          value={form.preferredQuestionStyle}
          onChange={(e: any) => setForm((prev) => ({ ...prev, preferredQuestionStyle: e.target.value }))}
          className="input"
        >
          <option value="mixed">Karışık</option>
          <option value="meaning">Anlam</option>
          <option value="context">Bağlam</option>
          <option value="translation">TR → EN</option>
          <option value="reverse_translation">EN → TR</option>
          <option value="typed_translation">TR → EN (yazarak)</option>
          <option value="typed_reverse_translation">EN → TR (yazarak)</option>
          <option value="spelling">Yazım</option>
          <option value="meaning_match">Tanım eşleştirme</option>
          <option value="example_match">Örnek cümle eşleştirme</option>
          <option value="sentence_completion">Cümle tamamlama</option>
          <option value="typed_sentence_completion">Cümle tamamlama (yazarak)</option>
        </select>
      </label>

      <label className="setting-card">
        <strong>Varsayılan quiz modu</strong>
        <select
          value={form.preferredQuizMode}
          onChange={(e: any) => setForm((prev) => ({ ...prev, preferredQuizMode: e.target.value }))}
          className="input"
        >
          <option value="mixed">Karışık tekrar</option>
          <option value="weak_only">Sadece zayıf kelimeler</option>
          <option value="new_only">Sadece yeni kelimeler</option>
          <option value="review">Bugün tekrar zamanı gelenler</option>
          <option value="mixed_old_new">Yeni + zayıf karışık</option>
        </select>
      </label>

      <div className="actions-row span-full">
        <button className="button button-primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Ayarları kaydet'}
        </button>
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </div>
  );
}
