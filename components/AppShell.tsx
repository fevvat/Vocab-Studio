import Link from 'next/link';
import { ReactNode } from 'react';

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
