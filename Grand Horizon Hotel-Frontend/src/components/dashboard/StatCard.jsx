/**
 * Reusable analytics tile for both the guest dashboard and the admin
 * portal. `icon` is a raw <path> element so callers can drop in any
 * outline-style icon without this component needing an icon library.
 */
export default function StatCard({ label, value, icon, accent = "navy", loading = false }) {
  const accentClasses =
    accent === "gold"
      ? "bg-gold-100 text-gold-700"
      : accent === "available"
        ? "bg-available-bg text-available-text"
        : accent === "occupied"
          ? "bg-occupied-bg text-occupied-text"
          : "bg-navy-800/8 text-navy-800";

  return (
    <div className="card-surface flex items-center gap-4 p-5 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-luxury">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accentClasses}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5.5 w-5.5" strokeWidth={1.7}>
          {icon}
        </svg>
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">{label}</p>
        {loading ? (
          <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-navy-950/10" />
        ) : (
          <p className="font-display text-2xl font-semibold text-navy-950">{value}</p>
        )}
      </div>
    </div>
  );
}
