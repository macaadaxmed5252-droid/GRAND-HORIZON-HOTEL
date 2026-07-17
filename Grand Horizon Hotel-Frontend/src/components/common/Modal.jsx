import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Centered modal with a backdrop. Closes on Escape or backdrop click.
 * Rendered via a portal directly under `document.body` rather than inline
 * in the caller's DOM position — a modal invoked from inside an ancestor
 * that has a CSS `transform` (even one only active on `:hover`, like a
 * room card's lift-on-hover effect) would otherwise get trapped as a
 * descendant of that ancestor's new containing block, clipped by any
 * `overflow-hidden` on the way up instead of covering the viewport.
 */
export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock background scroll while any modal is open (shared here so every
  // modal in the app gets it, not just the room preview). Compensating
  // with the scrollbar's own width as right padding stops the page from
  // jumping horizontally the instant the scrollbar disappears.
  useEffect(() => {
    if (!open) return undefined;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow || "unset";
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/40 backdrop-blur-md transition-opacity duration-300 ease-in-out"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-modal-in relative w-full ${maxWidth} max-h-[85vh] transform overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between border-b border-navy-950/8 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-navy-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-navy-950/40 transition-colors duration-300 ease-in-out hover:bg-navy-950/5 hover:text-navy-950"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
