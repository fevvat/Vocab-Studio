'use client';

export function playAudio(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Önceki okumayı iptal et
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // Biraz daha net anlaşılması için
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}
