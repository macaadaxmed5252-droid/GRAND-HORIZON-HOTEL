import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRooms } from "../api/rooms";
import { API_BASE_URL } from "../api/client";
import RoomCard from "../components/rooms/RoomCard";
import HeroSearchBar from "../components/home/HeroSearchBar";
import { SkeletonCard } from "../components/common/Skeleton";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useToast } from "../context/ToastContext";
import { useBookingGuard } from "../hooks/useBookingGuard";

const SHOWCASE_LIMIT = 6;

// Free-to-use under the Unsplash License (commercial use, no attribution
// required) — https://unsplash.com/photos/FQPQZmpwUkg, by Toa Heftiba.
const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1759223198981-661cadbbff36?q=80&w=1920&auto=format&fit=crop";

const AMENITY_HIGHLIGHTS = [
  {
    title: "Oceanfront Suites",
    copy: "Floor-to-ceiling views over the bay, private balconies, and a horizon that shifts color at dusk.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h10a4 4 0 014 4M3 15v4h18v-4M3 15l2-8h14l2 8" />
    ),
  },
  {
    title: "Considered Service",
    copy: "A dedicated concierge team, available around the clock, that remembers how you take your coffee.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM4 20a8 8 0 0116 0" />
    ),
  },
  {
    title: "Unhurried Dining",
    copy: "Seasonal, locally-sourced menus served at a pace that lets the evening actually unfold.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v7a2 2 0 002 2h0M8 3v18M16 3v18M16 3a2 2 0 012 2v4a2 2 0 01-2 2" />
    ),
  },
];

export default function HomePage() {
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const handleBookNow = useBookingGuard();
  const { apiError } = useToast();

  // Referenced via ref (not directly) inside load's own catch handler below,
  // so the retry button can call the latest `load` without load's useCallback
  // body self-referencing its own identifier.
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

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section
        role="img"
        aria-label="A luxurious hotel suite interior, warmly lit"
        className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-navy-950 bg-cover bg-center before:absolute before:inset-0 before:bg-navy-950/60 before:backdrop-blur-[2px] before:content-['']"
        style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
      >
        {/* A second, softer vertical wash on top of the frosted-glass `before:` layer keeps the headline and search bar readable against the busiest part of the photo (the chandelier/furniture) without flattening it entirely. */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-transparent to-navy-950/60" />

        <div className="relative z-10 flex w-full flex-col items-center gap-8 px-6 py-24 text-center md:px-12 lg:px-24">
          <span className="eyebrow rounded-full border border-gold-400/40 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            Est. on the Coastal Boulevard
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-white text-balance sm:text-5xl md:text-6xl">
            Where the horizon meets <span className="text-gold-400">quiet luxury</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Book a room at Grand Horizon Hotel — considered interiors, oceanfront views, and service that
            moves at your pace.
          </p>

          <HeroSearchBar />
        </div>
      </section>

      {/* ---------- Amenity highlights ---------- */}
      <section className="w-full px-6 py-20 md:px-12 lg:px-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {AMENITY_HIGHLIGHTS.map((item) => (
            <div
              key={item.title}
              className="card-surface p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-luxury"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-800/8 text-navy-800">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={1.6}>
                  {item.icon}
                </svg>
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-navy-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-950/60">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Dynamic accommodation showcase ---------- */}
      <section className="bg-surface py-20">
        <div className="w-full px-6 md:px-12 lg:px-24">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="eyebrow">Live Inventory</span>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy-950">Featured Accommodations</h2>
            </div>
            <Link to="/rooms" className="btn-outline">
              View All Rooms
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          <div className="mt-10">
            {status === "loading" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} lines={4} />
                ))}
              </div>
            )}

            {status === "error" && (
              <ErrorState
                message={`We couldn't load live room availability. Confirm the API at ${API_BASE_URL} is running and reachable from this browser.`}
                onRetry={load}
              />
            )}

            {status === "ready" && rooms.length === 0 && (
              <EmptyState title="No rooms yet" description="Check back shortly — new accommodations are added regularly." />
            )}

            {status === "ready" && rooms.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.slice(0, SHOWCASE_LIMIT).map((room) => (
                  <RoomCard key={room.id} room={room} onBookNow={handleBookNow} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
