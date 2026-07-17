import PillarCard from "../components/about/PillarCard";
import GalleryCard from "../components/about/GalleryCard";

// Free-to-use under the Unsplash License (commercial use, no attribution
// required) — https://unsplash.com/photos/CepDpEiALqM, by Gerson Repreza.
const STORY_IMAGE_URL = "https://images.unsplash.com/photo-1535827841776-24afc1e255ac?q=80&w=1920&auto=format&fit=crop";

// Gallery vignettes — all free-to-use under the Unsplash License (commercial
// use, no attribution required).
const LOBBY_IMAGE_URL =
  "https://images.unsplash.com/photo-1758193783649-13371d7fb8dd?q=80&w=1600&auto=format&fit=crop"; // https://unsplash.com/photos/Accg0bUgp7k, by Aalo Lens
const POOL_IMAGE_URL =
  "https://images.unsplash.com/photo-1758448756167-88dc934c58e4?q=80&w=1600&auto=format&fit=crop"; // https://unsplash.com/photos/KgybDitNR18, by Aalo Lens
const MARINA_IMAGE_URL =
  "https://images.unsplash.com/photo-1741183575544-ae96e3c8c221?q=80&w=1600&auto=format&fit=crop"; // https://unsplash.com/photos/9TGgFDdRXII, by Jeffrey Eisen

// Grand Horizon Hotel is fictional, so "Coastal Boulevard, Grand Horizon
// Bay" has no real coordinates to geocode. Kept in sync with the Corporate
// Address link below, so the embedded map, "Get Directions" button, and
// displayed address all point at the same real place.
const MAP_QUERY = "Makkah Al-mukaramah Hotel Mogadishu Somalia";
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=14&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_QUERY)}`;

const TIMELINE = [
  {
    year: "1998",
    title: "A Foundation on the Boulevard",
    copy: "Grand Horizon opens its doors with 40 rooms and a single promise: a view of the water from every one of them.",
  },
  {
    year: "2007",
    title: "The West Wing",
    copy: "An expansion adds the Suite collection and the hotel's first rooftop dining room, framed in reclaimed teak.",
  },
  {
    year: "2016",
    title: "A Considered Renovation",
    copy: "Every interior is reworked around natural light and local stone, moving away from anything that felt temporary.",
  },
  {
    year: "Today",
    title: "An Enterprise-Grade Stay",
    copy: "Reservations, guest records, and daily operations now run on a system built for precision — so the only thing you notice is the service.",
  },
];

const PILLARS = [
  {
    title: "Architectural Heritage",
    copy: "Every line borrows from the coastline itself — natural stone, reclaimed timber, and glass angled toward the sunset the building was designed around.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 12h.01M15 12h.01M9 8h.01M15 8h.01" />
      </svg>
    ),
  },
  {
    title: "Bespoke Hospitality",
    copy: "One guest, one dedicated concierge, for the length of the stay — a single point of contact reachable at any hour, not a rotating front desk.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18M4 18a8 8 0 0116 0M12 2v2m7.07 1.93l-1.41 1.41M4.93 5.93l1.41 1.41" />
      </svg>
    ),
  },
  {
    title: "Sustainable Horizon",
    copy: "Solar-assisted heating, reef-safe water systems, and a kitchen sourced almost entirely from growers within the bay — coastal preservation, not a slogan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 20A7 7 0 019 6c1.5 4 4 6 8 7-1 4-3.5 7-6 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 20c0-4 1-8 5-11" />
      </svg>
    ),
  },
];

const GALLERY = [
  { title: "The Lobby", copy: "Marble underfoot, ocean framed dead ahead.", image: LOBBY_IMAGE_URL },
  { title: "The Infinity Pool", copy: "Where the water meets the horizon, on purpose.", image: POOL_IMAGE_URL },
  { title: "The Yacht Marina", copy: "Private dock access, for mornings that start on the water.", image: MARINA_IMAGE_URL },
];

const AMENITIES = [
  { title: "Infinity Pool", copy: "Heated year-round, edged in limestone, open until midnight." },
  { title: "Coastal Spa", copy: "Treatment rooms facing the water, built around a single therapist-to-guest ratio." },
  { title: "Private Marina Access", copy: "Direct dock access for morning sails and sunset returns." },
  { title: "In-Room Dining, Always", copy: "A kitchen that never closes, for whichever hour your evening finds you." },
  { title: "Curated Wine Cellar", copy: "Over 200 labels, sourced with a bias toward small, independent growers." },
  { title: "Dedicated Concierge", copy: "One point of contact for the length of your stay, not a rotating desk." },
];

export default function AboutPage() {
  return (
    <div>
      {/* ---------- Intro ---------- */}
      <section
        role="img"
        aria-label="The exterior of a luxury coastal resort"
        className="relative overflow-hidden bg-cover bg-center py-24 text-white"
        style={{ backgroundImage: `url(${STORY_IMAGE_URL})` }}
      >
        <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12 lg:px-24">
          <span className="eyebrow">Our Story</span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Built slowly, on purpose
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            Grand Horizon Hotel was never meant to be the biggest room on the coast — just the one you'd choose
            to come back to. That idea has shaped every renovation, every hire, and every small decision since.
          </p>
        </div>
      </section>

      {/* ---------- Grand Pillars ---------- */}
      <section className="w-full px-6 py-20 md:px-12 lg:px-24">
        <div className="max-w-xl">
          <span className="eyebrow">What We Stand On</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy-950">
            The Grand Pillars of Luxury
          </h2>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.title} className="card-surface p-8">
              <span className="pillar-card__icon flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                {pillar.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-navy-950">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-950/60">{pillar.copy}</p>
            </PillarCard>
          ))}
        </div>
      </section>

      {/* ---------- Timeline ---------- */}
      <section className="w-full px-6 py-20 md:px-12 lg:px-24">
        <div className="relative border-l border-navy-950/10 pl-8">
          {TIMELINE.map((entry) => (
            <div key={entry.year} className="relative pb-12 last:pb-0">
              <span className="absolute -left-[calc(2rem+5px)] mt-1.5 h-2.5 w-2.5 rounded-full bg-gold-500 ring-4 ring-gold-100" />
              <span className="eyebrow">{entry.year}</span>
              <h3 className="mt-1 font-display text-xl font-semibold text-navy-950">{entry.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-950/60">{entry.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Amenities ---------- */}
      <section className="bg-surface py-20">
        <div className="w-full px-6 md:px-12 lg:px-24">
          <div className="max-w-xl">
            <span className="eyebrow">Amenities</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-navy-950">
              Everything, considered twice
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AMENITIES.map((amenity) => (
              <div
                key={amenity.title}
                className="card-surface p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-luxury"
              >
                <h3 className="font-display text-lg font-semibold text-navy-950">{amenity.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-950/60">{amenity.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Interactive Gallery ---------- */}
      <section className="bg-navy-950 py-20">
        <div className="w-full px-6 md:px-12 lg:px-24">
          <div className="max-w-xl">
            <span className="eyebrow">A Closer Look</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">
              The Grand Horizon Interactive Gallery
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map((slide, index) => (
              <GalleryCard key={slide.title} index={index} {...slide} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Find us ---------- */}
      <section className="w-full px-6 py-20 md:px-12 lg:px-24">
        <div className="max-w-xl">
          <span className="eyebrow">Find Us</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-navy-950">
            Grand Horizon Bay, Coastal Boulevard
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Left: interactive map — no API key required for this embed form. */}
          <div className="min-h-[22rem] overflow-hidden rounded-xl border border-navy-950/10 shadow-luxury-sm">
            <iframe
              title="Grand Horizon Hotel location"
              src={MAP_EMBED_SRC}
              className="h-full min-h-[22rem] w-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Right: contact details card. */}
          <div className="card-surface flex flex-col justify-center gap-5 bg-surface p-8 sm:p-10">
            <p className="text-sm leading-relaxed text-navy-950/60">
              Fifteen minutes from the airport, and a single unbroken stretch of coastline from the lobby to
              the water. Valet and private transfers are arranged for every arrival.
            </p>

            <dl className="flex flex-col gap-5 text-sm">
  {/* Corporate Address - Google Maps Link */}
  <div className="flex items-start gap-3 group">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600 transition-colors group-hover:bg-gold-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </span>
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Corporate Address</dt>
      <dd className="mt-0.5 font-medium">
        <a 
          href="https://www.google.com/maps/search/?api=1&query=Makkah+Al-mukaramah+Hotel+Mogadishu+Somalia" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-navy-950 hover:text-gold-600 hover:underline transition-colors block"
        >
          Makkah Al-mukaramah Street, Mogadishu, Somalia
        </a>
      </dd>
    </div>
  </div>

  {/* Front Desk - WhatsApp / Call Link */}
  <div className="flex items-start gap-3 group">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600 transition-colors group-hover:bg-gold-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    </span>
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Front Desk</dt>
      <dd className="mt-0.5 font-medium flex flex-col sm:flex-row sm:gap-3">
        <a 
          href="https://wa.me/252614395252?text=Hello%20Grand%20Horizon%20Hotel,%20I%20would%20like%20to%20make%20an%20inquiry." 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors font-semibold"
        >
          Chat on WhatsApp
        </a>
        <span className="hidden sm:inline text-navy-950/30">|</span>
        <a 
          href="tel:+252614395252" 
          className="text-navy-950 hover:text-gold-600 hover:underline transition-colors"
        >
          +252 61 439 5252
        </a>
      </dd>
    </div>
  </div>

  {/* VIP Booking - Direct Mailto Link */}
  <div className="flex items-start gap-3 group">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600 transition-colors group-hover:bg-gold-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </span>
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">VIP Booking</dt>
      <dd className="mt-0.5 font-medium">
        <a
          href="mailto:reservations@grandhorizonhotel.com?subject=VIP%20Room%20Reservation%20Inquiry"
          className="text-navy-950 hover:text-gold-600 hover:underline transition-colors block break-all"
        >
          reservations@grandhorizonhotel.com
        </a>
      </dd>
    </div>
  </div>
</dl>

            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-2 justify-center self-start !px-6"
            >
              Get Directions
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
