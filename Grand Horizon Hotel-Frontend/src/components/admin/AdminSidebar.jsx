import { NavLink } from "react-router-dom";
import {
  DashboardIcon,
  ReservationsIcon,
  CheckInOutIcon,
  GuestsIcon,
  RoomsIcon,
  ReportsIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
  ChevronLeftIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { to: "/admin/reservations", label: "Reservations", Icon: ReservationsIcon },
  { to: "/admin/check-in-out", label: "Check-In / Out", Icon: CheckInOutIcon },
  { to: "/admin/guests", label: "Guests", Icon: GuestsIcon },
  { to: "/admin/rooms", label: "Rooms", Icon: RoomsIcon },
  { to: "/admin/reports", label: "Reports", Icon: ReportsIcon },
  { to: "/admin/settings", label: "Settings", Icon: SettingsIcon },
];

/**
 * Permanent left sidebar for the admin portal. `collapsed` shrinks it to an
 * icon rail on desktop; `mobileOpen` controls the off-canvas drawer variant
 * used below the `lg` breakpoint. Both are lifted to AdminLayout so the
 * top bar's toggle buttons can drive this component.
 */
export default function AdminSidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile, user, onLogout }) {
  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-navy-950 text-white transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          ${collapsed ? "lg:w-20" : "lg:w-64"} w-72`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-5">
          <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? "lg:justify-center lg:w-full" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/50 text-gold-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </span>
            <span className={`font-display text-base font-semibold leading-none whitespace-nowrap transition-opacity duration-300 ${collapsed ? "lg:hidden" : ""}`}>
              Grand Horizon
              <span className="block text-[10px] font-sans font-medium uppercase tracking-[0.3em] text-gold-400">Admin</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out
                ${collapsed ? "lg:justify-center" : ""}
                ${isActive ? "bg-gold-600 text-white shadow-luxury-sm" : "text-white/65 hover:bg-white/8 hover:text-white"}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={`whitespace-nowrap transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`mb-2 flex items-center gap-2.5 rounded-xl px-2 py-2 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-600/20 text-xs font-semibold text-gold-400">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                (user?.name || user?.email || "A").charAt(0).toUpperCase()
              )}
            </div>
            <div className={`min-w-0 flex-1 transition-all duration-300 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-medium text-white">{user?.name || "Admin"}</p>
              <p className="truncate text-xs text-white/45">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/65 transition-all duration-300 ease-in-out hover:bg-white/8 hover:text-white ${collapsed ? "lg:justify-center" : ""}`}
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/40 transition-all duration-300 ease-in-out hover:bg-white/8 hover:text-white lg:flex"
          >
            <ChevronLeftIcon className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            <span className={collapsed ? "hidden" : ""}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
