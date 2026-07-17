import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchRooms, ROOM_TYPES, ROOM_STATUSES } from "../api/rooms";
import RoomCard from "../components/rooms/RoomCard";
import { SkeletonCard } from "../components/common/Skeleton";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";
import { titleCase } from "../utils/format";
import { useBookingGuard } from "../hooks/useBookingGuard";

const SORT_OPTIONS = [
  { value: "default", label: "Featured order" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Rating: Highest first" },
];

export default function RoomsPage() {
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading");
  const handleBookNow = useBookingGuard();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const { apiError } = useToast();

  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const carriedDates = checkIn && checkOut ? { checkIn, checkOut } : undefined;

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchRooms()
      .then((data) => {
        setRooms(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load rooms", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRooms = useMemo(() => {
    let result = rooms.filter((room) => {
      if (statusFilter !== "ALL" && room.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && room.type !== typeFilter) return false;

      const price = Number(room.pricePerNight);
      if (minPrice !== "" && price < Number(minPrice)) return false;
      if (maxPrice !== "" && price > Number(maxPrice)) return false;

      return true;
    });

    switch (sortBy) {
      case "price-asc":
        result = [...result].sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight));
        break;
      case "price-desc":
        result = [...result].sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight));
        break;
      case "rating-desc":
        result = [...result].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      default:
        break;
    }

    return result;
  }, [rooms, statusFilter, typeFilter, minPrice, maxPrice, sortBy]);

  function resetFilters() {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
  }

  const hasActiveFilters =
    statusFilter !== "ALL" || typeFilter !== "ALL" || minPrice !== "" || maxPrice !== "" || sortBy !== "default";

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="max-w-2xl">
        <span className="eyebrow">Live Inventory Explorer</span>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy-950">Rooms &amp; Suites</h1>
        <p className="mt-3 text-navy-950/60">
          Every card below reflects live data from our reservation system — availability updates the moment a
          booking is made.
        </p>
        {checkIn && checkOut && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-gold-100 px-4 py-1.5 text-sm font-medium text-gold-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Dates carried forward: {checkIn} → {checkOut}
          </p>
        )}
      </div>

      {/* ---------- Filter matrix ---------- */}
      <div className="card-surface mt-10 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label-luxury" htmlFor="filter-status">Availability</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input-luxury"
          >
            <option value="ALL">All statuses</option>
            {ROOM_STATUSES.map((option) => (
              <option key={option} value={option}>{titleCase(option)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-luxury" htmlFor="filter-type">Room Type</label>
          <select
            id="filter-type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="input-luxury"
          >
            <option value="ALL">All types</option>
            {ROOM_TYPES.map((option) => (
              <option key={option} value={option}>{titleCase(option)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-luxury" htmlFor="filter-min-price">Min Price</label>
          <input
            id="filter-min-price"
            type="number"
            min="0"
            placeholder="$0"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="input-luxury"
          />
        </div>

        <div>
          <label className="label-luxury" htmlFor="filter-max-price">Max Price</label>
          <input
            id="filter-max-price"
            type="number"
            min="0"
            placeholder="Any"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="input-luxury"
          />
        </div>

        <div>
          <label className="label-luxury" htmlFor="filter-sort">Sort By</label>
          <select
            id="filter-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="input-luxury"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="mt-3 text-sm font-medium text-navy-800/70 underline-offset-4 transition-colors duration-300 ease-in-out hover:text-gold-600 hover:underline"
        >
          Clear all filters
        </button>
      )}

      {/* ---------- Results ---------- */}
      <div className="mt-10">
        {status === "loading" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} />
            ))}
          </div>
        )}

        {status === "error" && <ErrorState message="We couldn't load rooms right now." onRetry={load} />}

        {status === "ready" && (
          <>
            <p className="mb-6 text-sm text-navy-950/50">
              Showing {filteredRooms.length} of {rooms.length} room{rooms.length === 1 ? "" : "s"}
            </p>

            {filteredRooms.length === 0 ? (
              <EmptyState title="No rooms match" description="Try widening your search or clearing filters." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onBookNow={(selectedRoom) => handleBookNow(selectedRoom, carriedDates)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
