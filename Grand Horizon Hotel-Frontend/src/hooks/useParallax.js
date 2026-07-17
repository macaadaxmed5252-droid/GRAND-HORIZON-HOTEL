import { useEffect, useRef, useState } from "react";

/**
 * Tracks how far an element's center sits from the viewport's vertical
 * center as the page scrolls, scaled by `strength` (px of drift at the
 * viewport edge). Used to give gallery cards a subtle floating-parallax
 * feel. A no-op under prefers-reduced-motion — offset stays 0.
 */
export function useParallax(strength = 20) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = null;

    function measure() {
      frame = null;
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const elementCenter = box.top + box.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const distance = (elementCenter - viewportCenter) / window.innerHeight;
      setOffset(distance * strength);
    }

    function onScroll() {
      if (frame !== null) return;
      frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return [ref, offset];
}
