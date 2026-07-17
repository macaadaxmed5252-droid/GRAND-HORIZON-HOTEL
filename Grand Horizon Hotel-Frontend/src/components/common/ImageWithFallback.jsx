import { useState } from "react";

/**
 * <img> that swaps to a soft placeholder if `src` 404s or otherwise fails
 * to load, instead of showing the browser's broken-image icon. Used
 * everywhere a room photo or avatar is rendered, since uploaded images can
 * legitimately go missing (deleted on disk, moved environments, etc.).
 */
export default function ImageWithFallback({ src, alt, className = "", fallbackIconClassName = "h-8 w-8" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950 text-white/30 ${className}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={fallbackIconClassName} strokeWidth={1.3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}
