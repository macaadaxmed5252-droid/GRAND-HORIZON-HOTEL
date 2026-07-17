import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { MenuIcon } from "./icons";
import { fetchOwnProfile, resolveAvatarUrl } from "../../api/adminApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/reservations": "Reservations",
  "/admin/check-in-out": "Check-In / Check-Out",
  "/admin/guests": "Guest Records",
  "/admin/rooms": "Room Inventory",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

const SIDEBAR_COLLAPSE_KEY = "ghh_admin_sidebar_collapsed";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const refreshProfile = useCallback(() => {
    fetchOwnProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      return next;
    });
  }

  function handleLogout() {
    logout();
    info("Signed out", "Come back soon.");
    navigate("/");
  }

  const sidebarUser = {
    name: profile?.name,
    email: profile?.email || user?.email,
    avatarUrl: resolveAvatarUrl(profile?.profileImageUrl),
  };

  const pageTitle = PAGE_TITLES[location.pathname] || "Admin Portal";

  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={sidebarUser}
        onLogout={handleLogout}
      />

      <div className={`transition-all duration-300 ease-in-out ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-navy-950/8 bg-white/90 px-5 py-4 backdrop-blur-md sm:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-full p-2 text-navy-800 transition-colors duration-300 ease-in-out hover:bg-navy-950/5 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-semibold text-navy-950">{pageTitle}</h1>
        </header>

        <main className="px-5 py-8 sm:px-8">
          <Outlet context={{ profile, refreshProfile }} />
        </main>
      </div>
    </div>
  );
}
