import Link from 'next/link';

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✨</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="button button-primary">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
