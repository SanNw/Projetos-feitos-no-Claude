import "./SkeletonCard.css";

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__cover shimmer" />
      <div className="skeleton-card__body">
        <div className="shimmer skeleton-card__line skeleton-card__line--badge" />
        <div className="shimmer skeleton-card__line skeleton-card__line--title" />
        <div className="shimmer skeleton-card__line skeleton-card__line--meta" />
        <div className="shimmer skeleton-card__line skeleton-card__line--text" />
        <div className="shimmer skeleton-card__line skeleton-card__line--text" />
      </div>
    </div>
  );
}
