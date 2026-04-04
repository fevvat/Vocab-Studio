import { ReactNode } from 'react';

export function StatCard({ title, value, hint, icon }: { title: string; value: string | number; hint: string; icon?: ReactNode }) {
  return (
    <div className="stat-card">
      <div className="stat-head">
        <span className="stat-title">{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}
