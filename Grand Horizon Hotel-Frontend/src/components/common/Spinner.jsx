/**
 * Small inline loading indicator. `tone` picks the stroke color so it reads
 * correctly whether it's sitting on a light card or a dark navy hero.
 */
export default function Spinner({ size = 20, tone = "gold", className = "" }) {
  const toneClass = tone === "light" ? "text-white" : tone === "navy" ? "text-navy-800" : "text-gold-600";

  return (
    <svg
      className={`animate-spin ${toneClass} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FullPageSpinner({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-navy-800/70">
      <Spinner size={32} tone="navy" />
      <p className="text-sm font-medium tracking-wide">{label}</p>
    </div>
  );
}
