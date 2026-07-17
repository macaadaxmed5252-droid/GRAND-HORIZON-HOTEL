import { titleCase } from "../../utils/format";

const ROOM_STATUS_STYLE = {
  AVAILABLE: "bg-available-bg text-available-text border-available-border",
  BOOKED: "bg-occupied-bg text-occupied-text border-occupied-border",
  MAINTENANCE: "bg-maintenance-bg text-maintenance-text border-maintenance-border",
};

const BOOKING_STATUS_STYLE = {
  CONFIRMED: "bg-available-bg text-available-text border-available-border",
  PENDING: "bg-maintenance-bg text-maintenance-text border-maintenance-border",
  CANCELLED: "bg-occupied-bg text-occupied-text border-occupied-border",
};

/**
 * Renders a room's `status` or a booking's `status` as a soft, colored pill.
 * Falls back to a neutral navy tint for any value it doesn't recognize, so
 * an unexpected enum value never renders as visually broken.
 */
export default function StatusBadge({ status, kind = "room" }) {
  const styles = kind === "booking" ? BOOKING_STATUS_STYLE : ROOM_STATUS_STYLE;
  const classes = styles[status] || "bg-navy-800/10 text-navy-800 border-navy-800/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {titleCase(status)}
    </span>
  );
}
