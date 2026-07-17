/**
 * Designed empty state: a soft illustration (not a stock icon), a clear
 * headline, and an optional action. Used whenever a data-driven screen has
 * successfully loaded but has nothing to show.
 */
export default function EmptyState({ title, description, action, icon }) {
  return (
    <div className="card-surface flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full text-navy-950/6" fill="currentColor">
          <circle cx="48" cy="48" r="48" />
        </svg>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800/8 text-navy-800/50">
          {icon || <DefaultIcon />}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-navy-950">{title}</h3>
        {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-navy-950/55">{description}</p>}
      </div>

      {action}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-2.5 6H6.5L4 13m16 0H4" />
    </svg>
  );
}
