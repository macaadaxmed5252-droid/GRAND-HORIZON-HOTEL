/**
 * Structural loading placeholders that mirror the shape of the content
 * they stand in for, so the layout doesn't jump when real data arrives.
 * Every shape shares the same shimmer animation via `.skeleton-shimmer`
 * (defined in index.css) rather than a generic spinner.
 */

function Base({ className = "" }) {
  return <div className={`skeleton-shimmer rounded-lg bg-navy-950/8 ${className}`} />;
}

export function SkeletonStatCard() {
  return (
    <div className="card-surface flex items-center gap-4 p-5">
      <Base className="h-12 w-12 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Base className="h-3 w-24" />
        <Base className="h-6 w-16" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex gap-4 border-b border-navy-950/8 px-5 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Base key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-navy-950/5 px-5 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Base key={colIndex} className={`h-4 flex-1 ${colIndex === 0 ? "max-w-24" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = "h-72" }) {
  return (
    <div className={`card-surface flex items-end gap-2 p-6 ${height}`}>
      {[40, 65, 50, 80, 55, 90, 45, 70, 60, 85, 50, 75].map((h, i) => (
        <Base key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card-surface space-y-3 p-5">
      <Base className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Base key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 64 }) {
  return <Base className="rounded-full" style={{ width: size, height: size }} />;
}
