import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

/** Shell for every guest-facing route (marketing pages, auth, booking, user dashboard). */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-cream">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
