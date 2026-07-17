import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchMyBookings } from "../api/bookings";
import { downloadBookingInvoicePdf } from "../utils/invoicePdf";
import StatCard from "../components/dashboard/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import Spinner from "../components/common/Spinner";
import { SkeletonStatCard, SkeletonTable } from "../components/common/Skeleton";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, titleCase } from "../utils/format";

function InvoiceAction({ booking, guestEmail }) {
  const { error: toastError } = useToast();
  const [generating, setGenerating] = useState(false);

  if (booking.status !== "CONFIRMED") {
    return <span className="text-xs text-navy-950/30">—</span>;
  }

  function handleDownload() {
    setGenerating(true);
    try {
      downloadBookingInvoicePdf(booking, guestEmail);
    } catch {
      toastError("Download Failed", "We couldn't generate that invoice. Please try again shortly.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-600 transition-colors duration-300 ease-in-out hover:text-gold-700 disabled:opacity-50"
    >
      {generating ? (
        <Spinner size={12} />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      )}
      Download Invoice
    </button>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { success, apiError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchMyBookings()
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load your dashboard", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state?.justBooked) {
      success("You're all set", "Your reservation is confirmed and listed below.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const active = bookings.filter((booking) => booking.status === "CONFIRMED");
    const totalSpent = bookings
      .filter((booking) => booking.status !== "CANCELLED")
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

    return { totalSpent, activeCount: active.length, totalCount: bookings.length };
  }, [bookings]);

  if (status === "error") {
    return (
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <ErrorState message="We couldn't load your dashboard." onRetry={load} />
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-96 h-96 w-96 rounded-full bg-navy-800/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <span className="eyebrow">Your Space</span>
        <h1 className="mt-2 font-display text-4xl font-semibold text-navy-950">
          Welcome back{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-navy-950/60">{user?.email}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Total Spent"
                value={formatCurrency(stats.totalSpent)}
                accent="gold"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8V6m0 10v2m0-12a9 9 0 100 18 9 9 0 000-18z" />}
              />
              <StatCard
                label="Active Reservations"
                value={stats.activeCount}
                accent="available"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />}
              />
              <StatCard
                label="Total Bookings"
                value={stats.totalCount}
                accent="navy"
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              />
            </>
          )}
        </div>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-navy-950">Your Reservations</h2>

          {loading && <div className="mt-5"><SkeletonTable rows={4} columns={8} /></div>}

          {!loading && bookings.length === 0 && (
            <div className="mt-5">
              <EmptyState title="No reservations yet" description="Once you book a stay with us, it will show up here." />
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-navy-950/8 bg-white/70 shadow-luxury backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy-950/8 text-xs font-semibold uppercase tracking-wider text-navy-950/45">
                      <th className="px-5 py-3.5">Reference</th>
                      <th className="px-5 py-3.5">Room Type</th>
                      <th className="px-5 py-3.5">Check-in</th>
                      <th className="px-5 py-3.5">Check-out</th>
                      <th className="px-5 py-3.5">Nights</th>
                      <th className="px-5 py-3.5">Total</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-navy-950/5 transition-colors duration-300 ease-in-out last:border-0 hover:bg-white"
                      >
                        <td className="px-5 py-4 font-medium text-navy-950">{booking.bookingReference}</td>
                        <td className="px-5 py-4 text-navy-950/70">
                          {titleCase(booking.room?.type)} · Room {booking.room?.roomNumber ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-navy-950/70">{formatDate(booking.checkInDate)}</td>
                        <td className="px-5 py-4 text-navy-950/70">{formatDate(booking.checkOutDate)}</td>
                        <td className="px-5 py-4 text-navy-950/70">{booking.totalNights}</td>
                        <td className="px-5 py-4 font-medium text-navy-950">{formatCurrency(booking.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <StatusBadge status={booking.status} kind="booking" />
                        </td>
                        <td className="px-5 py-4">
                          <InvoiceAction booking={booking} guestEmail={user?.email} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
