'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';
import { playAudio } from '@/lib/audio';

const links = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/upload', label: 'Kelime Ekle' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/progress-map', label: 'Oxford Haritası' },
  { href: '/weak-words', label: 'Zayıf Kelimeler' },
  { href: '/history', label: 'Geçmiş' },
  { href: '/settings', label: 'Ayarlar' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        handleSearch(searchQuery.trim());
      } else {
        setSearchResult(null);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  async function handleSearch(q: string) {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        setSearchResult({ error: 'Bulunamadı' });
      }
    } catch {
      setSearchResult({ error: 'Arama hatası' });
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">OX</div>
          <div>
            <div className="eyebrow">Oxford 3000 çalışma asistanı</div>
            <h1>Vocab Studio</h1>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <input
            type="text"
            className="input"
            style={{ padding: '10px 14px', fontSize: '0.9rem' }}
            placeholder="Sözlükte kelime ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery.trim().length > 1 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: 'var(--panel)', padding: '16px',
              borderRadius: '12px', marginTop: '8px', zIndex: 10,
              border: '1px solid var(--line)', boxShadow: 'var(--shadow)'
            }}>
              {isSearching ? (
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>Aranıyor...</p>
              ) : searchResult && !searchResult.error ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{searchResult.word}</h3>
                    <button type="button" className="button" style={{ padding: '4px 8px' }} onClick={() => playAudio(searchResult.word)}>🔊</button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}><strong>Tr:</strong> {searchResult.translationTr}</p>
                  {searchResult.definitionEn && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{searchResult.definitionEn}</p>}
                  {searchResult.level && <span className="chip" style={{ marginTop: '10px', display: 'inline-block', fontSize: '0.75rem' }}>Level: {searchResult.level}</span>}
                </div>
              ) : (
                <p className="error-text" style={{ margin: 0, fontSize: '0.85rem' }}>Sözlükte eşleşme kalıbı bulunamadı.</p>
              )}
            </div>
          )}
        </div>

        <nav className="nav-stack">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Akıllı tekrar mantığı</p>
          <p>
            Görsel, metin ve PDF girişleri aynı öğrenme hattına bağlanır. Yanlış yaptığın kelimeler daha sık gösterilir,
            Oxford ilerleme haritası ise ne kadar yol aldığını görünür kılar.
          </p>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
