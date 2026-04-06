import Link from 'next/link';
import { ReactNode } from 'react';

const primaryLinks = [
  { href: '/', label: 'Workspace' },
  { href: '/quiz', label: 'Quiz Lab' },
  { href: '/upload', label: 'Import' },
  { href: '/dashboard', label: 'Insights' },
  { href: '/weak-words', label: 'Recovery' },
];

const secondaryLinks = [
  { href: '/history', label: 'History' },
  { href: '/progress-map', label: 'Progress Map' },
  { href: '/ai-coach', label: 'Coach' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon">OV</div>
          <div>
            <div className="eyebrow">Oxford vocabulary system</div>
            <h1>Studio Console</h1>
          </div>
        </div>

        <div className="chip-row">
          <span className="chip">Focus Mode</span>
          <span className="chip">Quiz Driven</span>
        </div>

        <div className="sidebar-divider" />

        <nav className="nav-stack" aria-label="Primary navigation">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              <span>{link.label}</span>
              <span aria-hidden>↗</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <nav className="nav-stack" aria-label="Secondary navigation">
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              <span>{link.label}</span>
              <span aria-hidden>↗</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-card">
          <p className="sidebar-card-title">Today loop</p>
          <p>Build a quiz, clear weak words, review insights, then lock tomorrow's plan with Coach.</p>
          <ul className="sidebar-list">
            <li>Import or open a study unit</li>
            <li>Generate timed quiz session</li>
            <li>Finish due weak-word queue</li>
          </ul>
        </div>
      </aside>

      <main className="main-content">
        <div className="main-content-inner">{children}</div>
      </main>
    </div>
  );
}
