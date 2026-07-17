import { resolveRoomImageUrl } from "../../api/rooms";
import { formatCurrency, titleCase } from "../../utils/format";
import ImageWithFallback from "../common/ImageWithFallback";
import Modal from "../common/Modal";

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) return null;
  const clamped = Math.max(0, Math.min(5, Number(rating)));

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${clamped} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${index < Math.round(clamped) ? "fill-gold-500" : "fill-navy-950/15"}`}
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L10 14.9l-5.21 2.61 1-5.79-4.21-4.1 5.82-.85z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-navy-950/50">{clamped.toFixed(1)}</span>
    </div>
  );
}

/** Full-detail luxury view of a room — the card only ever shows a clipped summary. */
export default function RoomDetailsModal({ room, open, onClose, onBookNow }) {
  if (!room) return null;

  const isAvailable = room.status === "AVAILABLE";
  const imageUrl = resolveRoomImageUrl(room.imageUrl);
  const amenities = room.amenities || [];

  return (
    <Modal open={open} onClose={onClose} title={room.title || `Room ${room.roomNumber}`} maxWidth="max-w-3xl">
      <div className="flex flex-col gap-6">
        <div className="relative -mx-6 -mt-5 h-64 w-[calc(100%+3rem)] overflow-hidden sm:h-80">
          <ImageWithFallback src={imageUrl} alt={room.title || `Room ${room.roomNumber}`} className="h-full w-full object-cover" fallbackIconClassName="h-12 w-12" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 rounded-full bg-navy-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {titleCase(room.type)}
          </span>
          {!isAvailable && (
            <span className="absolute right-5 top-5 rounded-full bg-occupied-bg/95 px-3 py-1 text-[11px] font-semibold text-occupied-text backdrop-blur-sm">
              {room.status === "MAINTENANCE" ? "Under Maintenance" : "La Kireystay (Occupied)"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-navy-950">{room.title || `Room ${room.roomNumber}`}</h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-navy-950/40">Room {room.roomNumber}</p>
            </div>
            <RatingStars rating={room.rating} />
          </div>
        </div>

        {room.description && (
          <p className="text-sm leading-relaxed text-navy-950/70">{room.description}</p>
        )}

        <div className="grid gap-4 rounded-2xl bg-surface p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Room Type</p>
            <p className="mt-1 font-medium text-navy-950">{titleCase(room.type)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Availability</p>
            <p className="mt-1 font-medium text-navy-950">{titleCase(room.status)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Rate</p>
            <p className="mt-1 font-medium text-navy-950">{formatCurrency(room.pricePerNight)} / night</p>
          </div>
        </div>

        {amenities.length > 0 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-950/45">Amenities &amp; Features</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2 text-sm text-navy-950/75">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 shrink-0 text-gold-600" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-navy-950/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={onClose} className="btn-outline justify-center">
            Close
          </button>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => {
              onClose();
              onBookNow?.(room);
            }}
            className="btn-gold justify-center disabled:!bg-navy-950/10 disabled:!text-navy-950/40 disabled:!shadow-none"
          >
            {isAvailable ? `Book Now — ${formatCurrency(room.pricePerNight)} / night` : "Unavailable"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
