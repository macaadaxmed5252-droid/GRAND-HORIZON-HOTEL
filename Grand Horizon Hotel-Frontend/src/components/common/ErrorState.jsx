/**
 * Inline error state for a data-driven section: an explicit message plus a
 * retry action embedded directly in the page (the toast fired alongside it
 * covers the transient notification; this covers "the section itself is
 * still broken until you retry").
 */
export default function ErrorState({ message = "Something went wrong loading this data.", onRetry }) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 border-occupied-border bg-occupied-bg/40 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-occupied-bg text-occupied-text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 004.34 21h15.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.46 0z" />
        </svg>
      </span>
      <p className="font-medium text-occupied-text">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full border border-occupied-text/30 px-4 py-1.5 text-sm font-semibold text-occupied-text transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-occupied-text/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-5.36M20 15a9 9 0 01-14.13 5.36" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}
