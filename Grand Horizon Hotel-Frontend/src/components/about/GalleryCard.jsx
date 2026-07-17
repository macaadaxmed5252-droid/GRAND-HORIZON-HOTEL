import { useState } from "react";
import ImageWithFallback from "../common/ImageWithFallback";
import { useParallax } from "../../hooks/useParallax";

/**
 * Gallery tile with two independent 3D layers: the outer frame drifts
 * vertically with scroll (useParallax), the inner image sits at a static
 * per-card tilt that straightens and lifts on hover. Kept as two elements
 * so each owns its own `transform` — mixing scroll-driven and hover-driven
 * transforms on one element would fight over the same style property.
 */
export default function GalleryCard({ title, copy, image, index }) {
  const [ref, offset] = useParallax(18);
  const [hovered, setHovered] = useState(false);

  const staticTilt = index % 2 === 0 ? -4 : 4;
  const tilt = hovered ? 0 : staticTilt;
  const scale = hovered ? 1.06 : 1;

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl shadow-luxury-sm"
      style={{ transform: `translateY(${offset}px)`, perspective: "1000px" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="h-72 w-full transition-transform duration-500 ease-out"
        style={{ transform: `rotateY(${tilt}deg) scale(${scale})` }}
      >
        <ImageWithFallback src={image} alt={title} className="h-full w-full object-cover" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/10 to-transparent" />

      <div className="absolute inset-x-4 bottom-4 rounded-xl border border-gold-400/50 bg-white/10 p-4 backdrop-blur-md">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/75">{copy}</p>
      </div>
    </div>
  );
}
