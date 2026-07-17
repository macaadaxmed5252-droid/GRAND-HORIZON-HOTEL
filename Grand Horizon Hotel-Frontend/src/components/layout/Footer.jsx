import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-950/10 bg-navy-950 text-white/70">
      <div className="grid w-full gap-10 px-6 py-14 md:grid-cols-4 md:px-12 lg:px-24">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/50 text-gold-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold text-white">Grand Horizon Hotel</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            A quiet, elevated stay on the coastal boulevard — considered rooms, unhurried service, and a
            horizon that changes color every evening.
          </p>
        </div>

        <div>
          <h3 className="eyebrow">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/" className="transition-colors duration-300 ease-in-out hover:text-gold-400">Home</Link></li>
            <li><Link to="/rooms" className="transition-colors duration-300 ease-in-out hover:text-gold-400">Rooms &amp; Suites</Link></li>
            <li><Link to="/about" className="transition-colors duration-300 ease-in-out hover:text-gold-400">About</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow text-gold-500 font-medium tracking-wider uppercase text-xs">
            Reach the Front Desk
          </h3>
          <ul className="mt-4 space-y-3.5 text-sm">
            {/* Address Link */}
            <li>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Makkah+Al-mukaramah+Hotel+Mogadishu+Somalia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-200 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-white/40 group-hover:text-gold-400 transition-colors duration-200 shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>Makkah Al-mukaramah Street, Mogadishu, Somalia</span>
              </a>
            </li>

            {/* Phone Link */}
            <li>
              <a
                href="tel:+252614395252"
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-200 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-white/40 group-hover:text-gold-400 transition-colors duration-200 shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.622a10.114 10.114 0 0 0 1.94 3.161c1.47 1.808 3.631 3.216 5.8 4.225a10.107 10.107 0 0 0 3.3 1.023c.6.09 1.186-.142 1.57-.616l1.292-1.548a2.25 2.25 0 0 1 2.97-.477l3.533 2.156c.552.336.775.998.487 1.583a4.854 4.854 0 0 1-4.228 2.658c-2.4 0-5.385-1.049-8.4-4.065-3.016-3.016-4.065-6-4.065-8.4a4.853 4.853 0 0 1 2.658-4.228c.585-.288 1.248-.065 1.583.487l2.156 3.533a2.25 2.25 0 0 1-.477 2.97l-1.548 1.292c-.474.38-.706.967-.616 1.57a10.142 10.142 0 0 0 1.022 3.3" />
                </svg>
                <span>+252 61 439 5252</span>
              </a>
            </li>

            {/* Email Link */}
            <li>
              <a
                href="mailto:macaadaxmed5252@gmail.com"
                className="flex items-center gap-3 text-white/50 hover:text-white transition-colors duration-200 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-white/40 group-hover:text-gold-400 transition-colors duration-200 shrink-0"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="truncate">macaadaxmed5252@gmail.com</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/40 md:px-12 lg:px-24">
        © {year} Grand Horizon Hotel. All rights reserved.
      </div>
    </footer>
  );
}
