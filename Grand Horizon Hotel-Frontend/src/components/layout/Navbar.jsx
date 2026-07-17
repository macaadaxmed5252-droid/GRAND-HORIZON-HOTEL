import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { resolveAvatarUrl } from "../../api/usersApi";
import ImageWithFallback from "../common/ImageWithFallback";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/rooms", label: "Rooms" },
  { to: "/about", label: "About" },
];

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative px-1 py-2 text-sm font-medium tracking-wide transition-colors duration-300 ease-in-out ${
          isActive ? "text-gold-400" : "text-white/80 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            className={`absolute -bottom-0.5 left-0 h-px bg-gold-400 transition-all duration-300 ease-in-out ${
              isActive ? "w-full" : "w-0"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

function UserAvatar({ profile, email, className = "h-9 w-9" }) {
  const avatarUrl = resolveAvatarUrl(profile?.profileImageUrl);
  const initial = (profile?.name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <span className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-gold-400/60 ${className}`}>
      {avatarUrl ? (
        <ImageWithFallback src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-navy-800 text-sm font-semibold text-gold-300">
          {initial}
        </span>
      )}
    </span>
  );
}

function UserMenu({ isAdmin, user, profile, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.name || user?.email;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-300 ease-in-out hover:bg-white/10"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserAvatar profile={profile} email={user?.email} />
        <span className="max-w-[9rem] truncate text-sm font-medium text-white/85" title={user?.email}>
          {displayName}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-3.5 w-3.5 text-white/50 transition-transform duration-300 ease-in-out ${open ? "rotate-180" : ""}`} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className={`absolute right-0 top-full mt-2 w-52 origin-top-right rounded-2xl border border-navy-950/8 bg-white p-1.5 shadow-luxury transition-all duration-200 ease-in-out ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-navy-950">{displayName}</p>
          <p className="truncate text-xs text-navy-950/50">{user?.email}</p>
        </div>
        <div className="my-1 h-px bg-navy-950/8" />
        <Link
          to={isAdmin ? "/admin" : "/dashboard"}
          onClick={() => setOpen(false)}
          className="block rounded-xl px-3 py-2 text-sm text-navy-950/80 transition-colors duration-300 ease-in-out hover:bg-surface"
        >
          {isAdmin ? "Admin Portal" : "My Dashboard"}
        </Link>
        {!isAdmin && (
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm text-navy-950/80 transition-colors duration-300 ease-in-out hover:bg-surface"
          >
            Settings
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-occupied-text transition-colors duration-300 ease-in-out hover:bg-occupied-bg"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, profile, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    info("Signed out", "Come back soon.");
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-6 py-4 md:px-12 lg:px-24">
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/50 text-gold-400 transition-transform duration-300 ease-in-out group-hover:scale-[1.06]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold leading-none text-white">
            Grand Horizon
            <span className="block text-[10px] font-sans font-medium uppercase tracking-[0.3em] text-gold-400">
              Hotel
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <UserMenu isAdmin={isAdmin} user={user} profile={profile} onLogout={handleLogout} />
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-white/80 transition-colors duration-300 ease-in-out hover:text-white">
                Sign In
              </Link>
              <Link to="/register" className="btn-gold !px-5 !py-2.5">
                Book Your Stay
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-300 ease-in-out hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={1.8}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-white/10 bg-navy-950 transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.to} {...link} onClick={() => setMenuOpen(false)} />
          ))}
          <div className="my-2 h-px bg-white/10" />
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 py-2">
                <UserAvatar profile={profile} email={user?.email} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{profile?.name || user?.email}</p>
                  <p className="truncate text-xs text-white/50">{user?.email}</p>
                </div>
              </div>
              <Link
                to={isAdmin ? "/admin" : "/dashboard"}
                onClick={() => setMenuOpen(false)}
                className="py-2 text-sm font-medium text-white/80"
              >
                {isAdmin ? "Admin Portal" : "My Dashboard"}
              </Link>
              {!isAdmin && (
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="py-2 text-sm font-medium text-white/80">
                  Settings
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="btn-outline mt-2 !border-white/25 !bg-transparent !text-white">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="py-2 text-sm font-medium text-white/80">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-gold mt-2 justify-center">
                Book Your Stay
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
