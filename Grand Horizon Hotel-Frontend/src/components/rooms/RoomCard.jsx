import { useState } from "react";
import { resolveRoomImageUrl } from "../../api/rooms";
import { formatCurrency, titleCase } from "../../utils/format";
import ImageWithFallback from "../common/ImageWithFallback";
import RoomDetailsModal from "./RoomDetailsModal";

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) return null;
  const clamped = Math.max(0, Math.min(5, Number(rating)));

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${clamped} out of 5`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < Math.round(clamped);
        return (
          <svg
            key={index}
            viewBox="0 0 20 20"
            className={`h-3.5 w-3.5 ${filled ? "fill-gold-500" : "fill-navy-950/15"}`}
          >
            <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L10 14.9l-5.21 2.61 1-5.79-4.21-4.1 5.82-.85z" />
          </svg>
        );
      })}
      <span className="ml-1 text-xs font-medium text-navy-950/50">{clamped.toFixed(1)}</span>
    </div>
  );
}

/**
 * Shared room card for the homepage showcase and the Rooms explorer.
 * A room that is not AVAILABLE is visually dimmed, its booking action is
 * disabled, and an explicit status banner explains why.
 */
export default function RoomCard({ room, onBookNow }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isAvailable = room.status === "AVAILABLE";
  const imageUrl = resolveRoomImageUrl(room.imageUrl);
  const visibleAmenities = (room.amenities || []).slice(0, 3);
  const extraAmenityCount = Math.max(0, (room.amenities || []).length - visibleAmenities.length);

  return (
    <div
      className={`card-surface group flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-luxury ${
        !isAvailable ? "saturate-[0.55] opacity-90" : ""
      }`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-navy-800">
        <ImageWithFallback
          src={imageUrl}
          alt={room.title || `Room ${room.roomNumber}`}
          className={`h-full w-full object-cover transition-transform duration-500 ease-in-out ${
            isAvailable ? "group-hover:scale-105" : ""
          }`}
          fallbackIconClassName="h-10 w-10"
        />

        <span className="absolute left-3 top-3 rounded-full bg-navy-950/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          {titleCase(room.type)}
        </span>

        {!isAvailable && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 border-t border-occupied-border/60 bg-occupied-bg/95 px-3 py-2 text-xs font-semibold text-occupied-text backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 004.34 21h15.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.46 0z" />
            </svg>
            {room.status === "MAINTENANCE" ? "Under Maintenance" : "La Kireystay (Occupied)"}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-950">
              {room.title || `Room ${room.roomNumber}`}
            </h3>
            <p className="text-xs font-medium uppercase tracking-wider text-navy-950/40">Room {room.roomNumber}</p>
          </div>
          <RatingStars rating={room.rating} />
        </div>

        {room.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-navy-950/60">{room.description}</p>
        )}

        {visibleAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleAmenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-md border border-gold-200/50 bg-gold-100/60 px-3 py-1 text-xs font-medium text-gold-700"
              >
                {amenity}
              </span>
            ))}
            {extraAmenityCount > 0 && (
              <span className="rounded-md border border-navy-950/8 bg-navy-950/4 px-3 py-1 text-xs font-medium text-navy-800/50">
                +{extraAmenityCount} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="font-display text-xl font-semibold text-navy-950">
              {formatCurrency(room.pricePerNight)}
            </span>
            <span className="text-xs text-navy-950/40"> / night</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              aria-label={`View details for ${room.title || `Room ${room.roomNumber}`}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-navy-950/10 text-navy-800 transition-all duration-300 ease-in-out hover:border-navy-950/25 hover:bg-surface"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onBookNow?.(room)}
              className="btn-gold !px-5 !py-2.5 disabled:!bg-navy-950/10 disabled:!text-navy-950/40 disabled:!shadow-none"
            >
              {isAvailable ? "Book Now" : "Unavailable"}
            </button>
          </div>
        </div>
      </div>

      <RoomDetailsModal room={room} open={detailsOpen} onClose={() => setDetailsOpen(false)} onBookNow={onBookNow} />
    </div>
  );
}
