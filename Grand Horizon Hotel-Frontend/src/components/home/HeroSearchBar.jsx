import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toIsoDateString } from "../../utils/format";

function todayIso() {
  return toIsoDateString(new Date());
}

function tomorrowIso() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toIsoDateString(tomorrow);
}

/**
 * Embedded stay-dates search bar for the hero. The backend's `GET
 * /api/rooms` has no date-range availability filter, so this doesn't
 * attempt to fake server-side date filtering — instead it carries the
 * guest's desired dates forward as query params to the Rooms explorer,
 * which pre-fills them straight into the reservation form once a room is
 * picked, saving the guest from re-entering them later.
 */
export default function HeroSearchBar() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(tomorrowIso());
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError("");
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-3xl rounded-2xl border border-white/15 bg-white/95 p-4 shadow-luxury backdrop-blur-md sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="hero-check-in" className="label-luxury">
            Check-in
          </label>
          <input
            id="hero-check-in"
            type="date"
            value={checkIn}
            min={todayIso()}
            onChange={(event) => setCheckIn(event.target.value)}
            className="input-luxury"
            required
          />
        </div>

        <div className="flex-1">
          <label htmlFor="hero-check-out" className="label-luxury">
            Check-out
          </label>
          <input
            id="hero-check-out"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            className="input-luxury"
            required
          />
        </div>

        <button type="submit" className="btn-gold w-full sm:w-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          Search Stays
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-occupied-text">{error}</p>}
    </form>
  );
}
