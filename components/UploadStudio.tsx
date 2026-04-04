'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { buildCandidates } from '@/lib/word-pipeline';
import { InputMethod, ParsedWordCandidate } from '@/lib/types';
import { extractTextFromPdf } from '@/lib/pdf-client';

const DEFAULT_NOTES = 'Oxford 3000 setim için otomatik çıkarılan kelimeleri burada gözden geçirdim.';

function statusLabel(status: ParsedWordCandidate['status']) {
  switch (status) {
    case 'confirmed':
      return 'Onaylı';
    case 'suggested':
      return 'Önerili';
    default:
      return 'Şüpheli';
  }
}

export function UploadStudio() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('image');
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('Oxford 3000 - Yeni Çalışma Birimi');
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [rawText, setRawText] = useState('');
  const [manualText, setManualText] = useState('');
  const [candidates, setCandidates] = useState<ParsedWordCandidate[]>([]);
  const [extraWord, setExtraWord] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Hazır');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const words = useMemo(() => candidates.map((item) => item.suggestion && item.status !== 'confirmed' ? item.suggestion : item.word), [candidates]);
  const suspiciousCount = useMemo(() => candidates.filter((item) => item.status !== 'confirmed').length, [candidates]);

  function refreshCandidates(text: string, method: InputMethod) {
    const next = buildCandidates(text, method);
    setCandidates(next);
    setRawText(text);
    if (!next.length) {
      setError('Kelime çıkarılamadı. Daha net bir dosya veya daha temiz bir metin dene.');
    }
  }

  async function runImageOcr(file: File) {
    setInputMethod('image');
    setFileName(file.name);
    setIsRunning(true);
    setProgress(0);
    setProgressLabel('Görsel OCR hazırlanıyor');
    setError('');

    try {
      const worker = await createWorker('eng', 1, {
        logger: (message: any) => {
          if (message.status === 'recognizing text') {
            setProgress(Math.round((message.progress || 0) * 100));
            setProgressLabel('Görseldeki metin okunuyor');
          }
        },
      });
      const result = await worker.recognize(file);
      await worker.terminate();
      refreshCandidates(result.data.text, 'image');
    } catch (err) {
      console.error(err);
      setError('OCR sırasında bir hata oluştu. Tarayıcıda tekrar deneyebilirsin.');
    } finally {
      setIsRunning(false);
    }
  }

  async function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await runImageOcr(file);
  }

  async function handlePdfFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setInputMethod('pdf');
    setFileName(file.name);
    setIsRunning(true);
    setProgress(0);
    setProgressLabel('PDF hazırlanıyor');
    setError('');

    try {
      const text = await extractTextFromPdf(file, ({ stage, progress: nextProgress }) => {
        setProgress(nextProgress);
        setProgressLabel(stage);
      });
      refreshCandidates(text, 'pdf');
    } catch (err) {
      console.error(err);
      setError('PDF okunamadı. Metin tabanlı veya daha net bir PDF dene.');
    } finally {
      setIsRunning(false);
    }
  }

  function handleManualParse() {
    setInputMethod('text');
    setFileName('manuel-giris');
    setError('');
    refreshCandidates(manualText, 'text');
  }

  function updateCandidate(index: number, value: string) {
    setCandidates((prev) => prev.map((item, currentIndex) => currentIndex === index ? {
      ...item,
      word: value.trim().toLowerCase(),
      normalized: value.trim().toLowerCase(),
      suggestion: undefined,
      status: 'confirmed',
      matchedOxford: item.matchedOxford,
    } : item));
  }

  function applySuggestion(index: number) {
    setCandidates((prev) => prev.map((item, currentIndex) => currentIndex === index ? {
      ...item,
      word: item.suggestion ?? item.word,
      normalized: (item.suggestion ?? item.word).toLowerCase(),
      status: 'confirmed',
      matchedOxford: true,
      confidence: Math.max(item.confidence, 0.92),
    } : item));
  }

  function removeCandidate(index: number) {
    setCandidates((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  function addExtraWord() {
    const clean = extraWord.trim().toLowerCase();
    if (!clean) return;
    const fresh = buildCandidates(clean, 'text')[0];
    if (!fresh) return;
    setCandidates((prev) => {
      if (prev.some((item) => item.normalized === fresh.normalized)) return prev;
      return [...prev, fresh];
    });
    setExtraWord('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/study-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes,
          sourceName: fileName || 'manuel-giris',
          inputMethod,
          rawInput: rawText || manualText,
          candidates,
          words,
        }),
      });

      if (!response.ok) {
        throw new Error('Kaydetme başarısız');
      }

      const data = await response.json();
      window.location.href = `/study-units/${data.id}`;
    } catch (err) {
      console.error(err);
      setError('Çalışma birimi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-xl">
      <div className="section-card">
        <div className="section-head">
          <div>
            <h2>1. Giriş yöntemi seç</h2>
            <p>Görsel, manuel metin veya PDF ile kelime ekleyebilirsin. Üç yöntem de aynı doğrulama akışına gider.</p>
          </div>
        </div>

        <div className="upload-method-grid">
          <label className={`method-card ${inputMethod === 'image' ? 'method-card-active' : ''}`}>
            <input type="file" accept="image/*" hidden onChange={handleImageFile} />
            <strong>Görsel yükle</strong>
            <span>Screenshot, fotoğraf veya taranmış kelime listesi</span>
          </label>

          <div className={`method-card ${inputMethod === 'text' ? 'method-card-active' : ''}`}>
            <strong>Metin yapıştır</strong>
            <span>Satır satır, virgüllü veya karışık metin kabul edilir</span>
            <textarea
              className="textarea textarea-small"
              value={manualText}
              onChange={(e: any) => setManualText(e.target.value)}
              placeholder={'book\napple\ntravel\nveya: book, apple, travel'}
            />
            <button className="button button-primary" type="button" onClick={handleManualParse}>
              Metni kelimelere dönüştür
            </button>
          </div>

          <label className={`method-card ${inputMethod === 'pdf' ? 'method-card-active' : ''}`}>
            <input type="file" accept="application/pdf" hidden onChange={handlePdfFile} />
            <strong>PDF yükle</strong>
            <span>Metin tabanlı PDF doğrudan okunur, tarama PDF için OCR denenir</span>
          </label>
        </div>

        {fileName ? <p className="muted">Seçilen kaynak: {fileName}</p> : null}
        {isRunning ? (
          <div className="progress-wrap">
            <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
            <p className="muted">{progressLabel} • %{progress}</p>
          </div>
        ) : null}
      </div>

      <div className="section-card">
        <div className="section-head">
          <div>
            <h2>2. Çalışma birimini düzenle</h2>
            <p>Şüpheli kelimeleri tek tıkla düzelt, gerekirse kendi kelimeni ekle, sonra kaydet.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Birim başlığı</span>
            <input value={title} onChange={(e: any) => setTitle(e.target.value)} className="input" />
          </label>
          <label>
            <span>Not</span>
            <input value={notes} onChange={(e: any) => setNotes(e.target.value)} className="input" />
          </label>
        </div>

        <label className="label-block">
          <span>Ham çıkarılan metin</span>
          <textarea value={rawText} onChange={(e: any) => setRawText(e.target.value)} className="textarea textarea-small" />
        </label>

        <div className="review-toolbar">
          <div className="chip-row">
            <span className="chip">Toplam: {candidates.length}</span>
            <span className={`chip ${suspiciousCount ? 'chip-danger' : ''}`}>İncelenecek: {suspiciousCount}</span>
            <span className="chip">Yöntem: {inputMethod}</span>
          </div>

          <div className="actions-row">
            <input
              className="input inline-input"
              value={extraWord}
              onChange={(e: any) => setExtraWord(e.target.value)}
              placeholder="Ek kelime ekle"
            />
            <button type="button" className="button" onClick={addExtraWord}>Kelime ekle</button>
          </div>
        </div>

        <div className="review-list">
          {candidates.map((candidate, index) => (
            <div key={`${candidate.normalized}-${index}`} className="review-row">
              <div className="review-main">
                <input
                  value={candidate.word}
                  onChange={(e: any) => updateCandidate(index, e.target.value)}
                  className="input"
                />
                <div className="chip-row">
                  <span className={`chip ${candidate.status !== 'confirmed' ? 'chip-danger' : ''}`}>{statusLabel(candidate.status)}</span>
                  <span className="chip">%{Math.round(candidate.confidence * 100)}</span>
                  {candidate.level ? <span className="chip">{candidate.level}</span> : null}
                  {candidate.matchedOxford ? <span className="chip">Oxford eşleşti</span> : <span className="chip chip-danger">Yerel listede yok</span>}
                </div>
              </div>
              <div className="actions-row review-actions">
                {candidate.suggestion ? (
                  <button type="button" className="button" onClick={() => applySuggestion(index)}>
                    Öneri uygula: {candidate.suggestion}
                  </button>
                ) : null}
                <button type="button" className="button" onClick={() => removeCandidate(index)}>Sil</button>
              </div>
            </div>
          ))}
        </div>

        <div className="actions-row between">
          <div className="chip-row">
            {words.slice(0, 20).map((word) => (
              <span key={word} className="chip">{word}</span>
            ))}
          </div>
          <button className="button button-primary" onClick={handleSave} disabled={!words.length || saving}>
            {saving ? 'Kaydediliyor...' : `Çalışma birimini kaydet (${words.length} kelime)`}
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
