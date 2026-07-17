import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllReservations, updateBookingDetails } from "../../api/adminApi";
import { fetchRooms } from "../../api/rooms";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../common/Skeleton";
import ErrorState from "../common/ErrorState";
import EmptyState from "../common/EmptyState";
import Modal from "../common/Modal";
import FormField from "../common/FormField";
import Spinner from "../common/Spinner";
import { formatCurrency, formatDate, titleCase, toIsoDateString } from "../../utils/format";

const PAGE_SIZE = 8;

const STATUS_LABELS = {
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  PENDING: "Pending",
};

const STATUS_STYLES = {
  CONFIRMED: "bg-available-bg text-available-text border-available-border",
  CHECKED_IN: "bg-navy-800/10 text-navy-800 border-navy-800/20",
  CHECKED_OUT: "bg-gold-100 text-gold-700 border-gold-200",
  PENDING: "bg-maintenance-bg text-maintenance-text border-maintenance-border",
};

const AVATAR_PALETTE = ["bg-navy-800", "bg-gold-600", "bg-navy-600", "bg-gold-700", "bg-navy-500"];

/** Confirmed/checked-in/checked-out/pending is derived, not a raw backend enum — BookingStatus only has PENDING/CONFIRMED/CANCELLED, with check-in/out tracked as separate timestamps. */
function deriveDisplayStatus(booking) {
  if (booking.checkedOutAt) return "CHECKED_OUT";
  if (booking.checkedInAt) return "CHECKED_IN";
  if (booking.status === "CONFIRMED") return "CONFIRMED";
  return "PENDING";
}

function isActiveToday(booking, todayIso) {
  return booking.status !== "CANCELLED" && booking.checkInDate <= todayIso && todayIso <= booking.checkOutDate;
}

function avatarColorFor(name) {
  const sum = (name || "?").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

function GuestAvatar({ name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(name)}`}>
      {initial}
    </span>
  );
}

function StatusPill({ displayStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${STATUS_STYLES[displayStatus]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[displayStatus]}
    </span>
  );
}

function ViewReservationModal({ booking, onClose }) {
  return (
    <Modal open={Boolean(booking)} onClose={onClose} title="Reservation Details" maxWidth="max-w-lg">
      {booking && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <GuestAvatar name={booking.guestFullName} />
            <div>
              <p className="font-display text-lg font-semibold text-navy-950">{booking.guestFullName}</p>
              <p className="text-xs text-navy-950/50">{booking.bookingReference}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Room</dt>
              <dd className="mt-0.5 font-medium text-navy-950">
                {titleCase(booking.room?.type)} · Room {booking.room?.roomNumber}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Status</dt>
              <dd className="mt-0.5"><StatusPill displayStatus={deriveDisplayStatus(booking)} /></dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Check-in</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{formatDate(booking.checkInDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Check-out</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{formatDate(booking.checkOutDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Guests</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{booking.guestCount ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Total</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{formatCurrency(booking.totalAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Payment Method</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{booking.paymentMethod ? titleCase(booking.paymentMethod) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Passport / ID</dt>
              <dd className="mt-0.5 font-medium text-navy-950">{booking.passportId || "Not provided"}</dd>
            </div>
          </dl>

          <div className="flex justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function EditReservationModal({ booking, rooms, onClose, onSaved }) {
  const { success, apiError } = useToast();
  const [form, setForm] = useState({ status: "CONFIRMED", checkInDate: "", checkOutDate: "", roomNumber: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (booking) {
      setForm({
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomNumber: booking.room?.roomNumber || "",
      });
      setFormError("");
    }
  }, [booking]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.checkOutDate <= form.checkInDate) {
      setFormError("Check-in date must be strictly before the check-out date.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const updated = await updateBookingDetails(booking.id, form);
      success("Reservation Updated", `${updated.bookingReference} has been saved.`);
      onSaved(updated);
      onClose();
    } catch (err) {
      setFormError(err.message || "Something went wrong while saving this reservation.");
      apiError("Couldn't save reservation", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(booking)} onClose={onClose} title={booking ? `Edit ${booking.bookingReference}` : "Edit Reservation"} maxWidth="max-w-lg">
      {booking && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
              {formError}
            </div>
          )}

          <div>
            <label className="label-luxury" htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="input-luxury"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label-luxury" htmlFor="edit-room">Room</label>
            <select
              id="edit-room"
              value={form.roomNumber}
              onChange={(e) => updateField("roomNumber", e.target.value)}
              className="input-luxury"
            >
              {booking.room?.roomNumber && !rooms.some((r) => r.roomNumber === booking.room.roomNumber) && (
                <option value={booking.room.roomNumber}>
                  Room {booking.room.roomNumber} (current)
                </option>
              )}
              {rooms.map((room) => (
                <option key={room.id} value={room.roomNumber}>
                  Room {room.roomNumber} · {titleCase(room.type)} · {formatCurrency(room.pricePerNight)}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="edit-check-in"
              label="Check-in Date"
              type="date"
              required
              value={form.checkInDate}
              onChange={(e) => updateField("checkInDate", e.target.value)}
            />
            <FormField
              id="edit-check-out"
              label="Check-out Date"
              type="date"
              required
              min={form.checkInDate}
              value={form.checkOutDate}
              onChange={(e) => updateField("checkOutDate", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-gold">
              {submitting && <Spinner size={16} tone="light" />}
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function TodaysReservationsPanel() {
  const { apiError } = useToast();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    Promise.all([fetchAllReservations(), fetchRooms({ status: "AVAILABLE" })])
      .then(([reservationsData, roomsData]) => {
        setBookings(Array.isArray(reservationsData) ? reservationsData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load today's reservations", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const todayIso = useMemo(() => toIsoDateString(new Date()), []);

  const todaysBookings = useMemo(
    () => bookings.filter((booking) => isActiveToday(booking, todayIso)),
    [bookings, todayIso],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return todaysBookings;
    return todaysBookings.filter((booking) => booking.guestFullName?.toLowerCase().includes(term));
  }, [todaysBookings, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function handleSaved(updatedBooking) {
    // Optimistic in-place update — no full reservations re-fetch needed
    // since the backend already returned the authoritative saved record.
    setBookings((current) => current.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
  }

  const todayLabel = new Date(`${todayIso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-navy-950/8 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-950">Today's Reservations</h2>
          <p className="mt-1 text-sm text-navy-950/50">
            {todayLabel} — {todaysBookings.length} total booking{todaysBookings.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search guest..."
            className="input-luxury w-full sm:w-56"
          />
          <Link to="/admin/reservations" className="btn-gold shrink-0 !px-4 !py-2.5 text-sm">
            + New Booking
          </Link>
        </div>
      </div>

      {status === "loading" && <div className="p-6"><SkeletonTable rows={5} columns={7} /></div>}

      {status === "error" && (
        <div className="p-6">
          <ErrorState message="We couldn't load today's reservations." onRetry={load} />
        </div>
      )}

      {status === "ready" && filtered.length === 0 && (
        <div className="p-6">
          <EmptyState
            title={search ? "No reservations match" : "Nothing scheduled today"}
            description={search ? "Try a different guest name." : "No bookings are checking in, staying, or checking out today."}
          />
        </div>
      )}

      {status === "ready" && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy-950/8 text-xs font-semibold uppercase tracking-wider text-navy-950/45">
                  <th className="px-6 py-3.5">Booking ID</th>
                  <th className="px-6 py-3.5">Guest Name</th>
                  <th className="px-6 py-3.5">Room</th>
                  <th className="px-6 py-3.5">Check-in</th>
                  <th className="px-6 py-3.5">Check-out</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((booking) => (
                  <tr key={booking.id} className="border-b border-navy-950/5 transition-colors duration-300 ease-in-out last:border-0 hover:bg-surface">
                    <td className="px-6 py-4 font-medium text-navy-950">{booking.bookingReference}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <GuestAvatar name={booking.guestFullName} />
                        <span className="text-navy-950/80">{booking.guestFullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-navy-950/70">Room {booking.room?.roomNumber}</td>
                    <td className="px-6 py-4 text-navy-950/70">{formatDate(booking.checkInDate)}</td>
                    <td className="px-6 py-4 text-navy-950/70">{formatDate(booking.checkOutDate)}</td>
                    <td className="px-6 py-4"><StatusPill displayStatus={deriveDisplayStatus(booking)} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setViewTarget(booking)} className="text-xs font-semibold text-navy-800 transition-opacity duration-300 ease-in-out hover:opacity-70">
                          View
                        </button>
                        <button type="button" onClick={() => setEditTarget(booking)} className="text-xs font-semibold text-gold-600 transition-opacity duration-300 ease-in-out hover:opacity-70">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 border-t border-navy-950/8 p-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ease-in-out ${
                    i === currentPage ? "bg-navy-800 text-white" : "text-navy-950/50 hover:bg-surface"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <ViewReservationModal booking={viewTarget} onClose={() => setViewTarget(null)} />
      <EditReservationModal booking={editTarget} rooms={rooms} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
    </div>
  );
}
