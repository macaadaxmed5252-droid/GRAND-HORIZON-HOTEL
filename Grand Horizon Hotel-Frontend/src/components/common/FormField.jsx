import { useState } from "react";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.6 13.6 0 0 1-3.1 3.9M6.6 6.6C3.8 8.4 1.5 12 1.5 12s3.5 7 10.5 7a10.4 10.4 0 0 0 4.4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

/**
 * Label + input + inline error message, wired for the backend's per-field
 * validation envelope (`{ errors: { fieldName: message } }`). Any prop not
 * explicitly listed is forwarded straight to the underlying <input>.
 *
 * `icon` is optional — a small leading glyph (e.g. a card outline) shown
 * inside the input, for fields where that visually reinforces what's being
 * typed. Omit it and the field renders exactly as before.
 *
 * `type="password"` fields automatically get a show/hide toggle on the
 * trailing edge of the input.
 */
export default function FormField({ label, id, error, hint, textarea = false, icon, type, ...inputProps }) {
  const Component = textarea ? "textarea" : "input";
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label-luxury">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-navy-950/35">
            {icon}
          </span>
        )}
        <Component
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={`input-luxury ${textarea ? "min-h-[6rem] resize-y" : ""} ${icon ? "!pl-11" : ""} ${
            isPassword ? "!pr-11" : ""
          } ${error ? "!border-occupied-text focus:!ring-occupied-text/15" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="password-toggle-btn"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-occupied-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-navy-950/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
