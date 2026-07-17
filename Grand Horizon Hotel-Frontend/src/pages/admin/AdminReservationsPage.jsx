import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAllReservations, updateReservationStatus } from "../../api/adminApi";
import { BOOKING_STATUSES } from "../../api/bookings";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner from "../../components/common/Spinner";
import { formatCurrency, formatDate, titleCase } from "../../utils/format";

function RowActions({ booking, onChanged }) {
  const { success, apiError } = useToast();
  const [pending, setPending] = useState(null);

  async function mutate(status) {
    setPending(status);
    try {
      await updateReservationStatus(booking.id, status);
      success("Reservation Updated", `${booking.bookingReference} is now ${status.toLowerCase()}.`);
      onChanged(booking.id, status);
    } catch (err) {
      apiError("Update Failed", err, () => mutate(status));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {booking.status === "PENDING" && (
        <button
          type="button"
          onClick={() => mutate("CONFIRMED")}
          disabled={pending !== null}
          className="inline-flex items-center gap-1 text-xs font-semibold text-available-text transition-opacity duration-300 ease-in-out hover:opacity-70 disabled:opacity-40"
        >
          {pending === "CONFIRMED" && <Spinner size={12} />}
          Confirm
        </button>
      )}
      {booking.status !== "CANCELLED" && (
        <button
          type="button"
          onClick={() => mutate("CANCELLED")}
          disabled={pending !== null}
          className="inline-flex items-center gap-1 text-xs font-semibold text-occupied-text transition-opacity duration-300 ease-in-out hover:opacity-70 disabled:opacity-40"
        >
          {pending === "CANCELLED" && <Spinner size={12} />}
          Cancel
        </button>
      )}
      {booking.status === "CANCELLED" && <span className="text-xs text-navy-950/30">No actions</span>}
    </div>
  );
}

export default function AdminReservationsPage() {
  const { apiError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchAllReservations()
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load reservations", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  function handleChanged(id, nextStatus) {
    setBookings((current) => current.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)));
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== "ALL" && booking.status !== statusFilter) return false;
      if (!term) return true;
      return (
        booking.bookingReference?.toLowerCase().includes(term) ||
        booking.guestFullName?.toLowerCase().includes(term) ||
        booking.room?.roomNumber?.toLowerCase().includes(term)
      );
    });
  }, [bookings, statusFilter, search]);

  if (status === "loading") {
    return <SkeletonTable rows={6} columns={8} />;
  }
  if (status === "error") {
    return <ErrorState message="We couldn't load the master reservations table." onRetry={load} />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="label-luxury" htmlFor="reservation-search">Search</label>
          <input
            id="reservation-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, guest name, or room number"
            className="input-luxury"
          />
        </div>
        <div className="sm:w-56">
          <label className="label-luxury" htmlFor="reservation-status">Status</label>
          <select
            id="reservation-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-luxury"
          >
            <option value="ALL">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No reservations match"
          description={bookings.length === 0 ? "No bookings have been made yet." : "Try clearing your filters."}
        />
      ) : (
        <div className="card-surface max-h-[36rem] overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-navy-950/8 text-xs font-semibold uppercase tracking-wider text-navy-950/45">
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Guest</th>
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Check-in</th>
                <th className="px-5 py-3.5">Check-out</th>
                <th className="px-5 py-3.5">Guests</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-navy-950/5 transition-colors duration-300 ease-in-out last:border-0 hover:bg-surface"
                >
                  <td className="px-5 py-4 font-medium text-navy-950">{booking.bookingReference}</td>
                  <td className="px-5 py-4 text-navy-950/70">{booking.guestFullName}</td>
                  <td className="px-5 py-4 text-navy-950/70">
                    {booking.room?.title || `Room ${booking.room?.roomNumber ?? "—"}`}
                  </td>
                  <td className="px-5 py-4 text-navy-950/70">{formatDate(booking.checkInDate)}</td>
                  <td className="px-5 py-4 text-navy-950/70">{formatDate(booking.checkOutDate)}</td>
                  <td className="px-5 py-4 text-navy-950/70">{booking.guestCount ?? "—"}</td>
                  <td className="px-5 py-4 font-medium text-navy-950">{formatCurrency(booking.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={booking.status} kind="booking" />
                  </td>
                  <td className="px-5 py-4">
                    <RowActions booking={booking} onChanged={handleChanged} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
