import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    ring: "border-available-border",
    bar: "bg-available-text",
    iconBg: "bg-available-bg",
    iconText: "text-available-text",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ),
  },
  error: {
    ring: "border-occupied-border",
    bar: "bg-occupied-text",
    iconBg: "bg-occupied-bg",
    iconText: "text-occupied-text",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ),
  },
  info: {
    ring: "border-navy-800/15",
    bar: "bg-navy-800",
    iconBg: "bg-navy-800/10",
    iconText: "text-navy-800",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
};

function ToastCard({ toast, onDismiss }) {
  const [mounted, setMounted] = useState(false);

  useState(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  });

  const variant = VARIANT_STYLES[toast.type] || VARIANT_STYLES.info;

  return (
    <div
      role="status"
      className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-white/95 shadow-luxury backdrop-blur-sm
        transition-all duration-300 ease-in-out ${variant.ring}
        ${mounted ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${variant.bar}`} />
      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${variant.iconBg} ${variant.iconText}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            {variant.icon}
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          {toast.title && <p className="text-sm font-semibold text-navy-950">{toast.title}</p>}
          {toast.message && <p className="mt-0.5 text-sm text-navy-950/70">{toast.message}</p>}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action.onClick();
                onDismiss(toast.id);
              }}
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ease-in-out hover:scale-[1.03] ${variant.ring} ${variant.iconText}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.13-5.36M20 15a9 9 0 01-14.13 5.36" />
              </svg>
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-full p-1 text-navy-950/40 transition-colors duration-200 hover:bg-navy-950/5 hover:text-navy-950"
          aria-label="Dismiss notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, message, action, duration }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Give the reader more time when there's a retry button to actually click.
      const resolvedDuration = duration ?? (action ? 8000 : 4500);
      setToasts((current) => [...current, { id, type, title, message, action }]);
      if (resolvedDuration > 0) {
        const timer = setTimeout(() => dismiss(id), resolvedDuration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      showToast,
      dismiss,
      success: (title, message, opts) => showToast({ type: "success", title, message, ...opts }),
      error: (title, message, opts) => showToast({ type: "error", title, message, ...opts }),
      info: (title, message, opts) => showToast({ type: "info", title, message, ...opts }),
      /**
       * Convenience for the common "API call failed" case: pulls a clean
       * message off an ApiError (or falls back to a generic one) and wires
       * an inline retry button that re-invokes the failed call.
       */
      apiError: (title, err, retryFn) =>
        showToast({
          type: "error",
          title,
          message: err?.message || "Something went wrong. Please try again.",
          action: retryFn ? { label: "Retry", onClick: retryFn } : undefined,
        }),
    }),
    [showToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with its Provider
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}
