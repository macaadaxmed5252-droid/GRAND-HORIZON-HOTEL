import { useCallback } from "react";

/**
 * Pillars-section card. Deliberately has no rotate/skew on hover — the
 * depth illusion comes entirely from the `.pillar-card` rules in index.css:
 * a cursor-tracked light reflection (`--mouse-x`/`--mouse-y`, set here),
 * a deepening shadow, and a small vertical lift on the card and its inner
 * content. The card itself never leaves its flat, square footprint.
 */
export default function PillarCard({ children, className = "" }) {
  const handleMouseMove = useCallback((event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div onMouseMove={handleMouseMove} className={`pillar-card ${className}`}>
      <div className="pillar-card__content">{children}</div>
    </div>
  );
}
