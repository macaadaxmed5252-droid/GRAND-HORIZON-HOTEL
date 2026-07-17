/**
 * Literal hex values mirroring the Tailwind `@theme` tokens in index.css.
 * Recharts renders to SVG/canvas and can't read CSS custom properties, so
 * the palette has to be duplicated here rather than referenced.
 */
export const CHART_COLORS = {
  navy: "#285a59",
  navyLight: "#4caba9",
  gold: "#b45309",
  goldLight: "#d4a72c",
  sage: "#4b7a5b",
  coral: "#b24b3b",
  slate: "#8a94a8",
};

/** Categorical palette for the room-type donut - stable order for up to 6 room types. */
export const CATEGORICAL_PALETTE = [
  CHART_COLORS.navy,
  CHART_COLORS.gold,
  CHART_COLORS.sage,
  CHART_COLORS.coral,
  CHART_COLORS.navyLight,
  CHART_COLORS.goldLight,
];
