import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCheckInOut, checkInBooking, checkOutBooking } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { SkeletonCard } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Spinner from "../../components/common/Spinner";
import { toIsoDateString } from "../../utils/format";

function GuestRow({ booking, kind, onDone }) {
  const { success, apiError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const alreadyDone = kind === "arrival" ? Boolean(booking.checkedInAt) : Boolean(booking.checkedOutAt);

  async function handleAction() {
    setSubmitting(true);
    try {
      if (kind === "arrival") {
        await checkInBooking(booking.id);
        success("Checked In", `${booking.guestFullName} is now checked in.`);
      } else {
        await checkOutBooking(booking.id);
        success("Checked Out", `${booking.guestFullName} is now checked out.`);
      }
      onDone(booking.id, kind);
    } catch (err) {
      apiError(kind === "arrival" ? "Check-in failed" : "Check-out failed", err, handleAction);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-navy-950/5 px-5 py-4 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy-950">{booking.guestFullName}</p>
        <p className="mt-0.5 text-xs text-navy-950/50">
          {booking.bookingReference} &middot; Room {booking.room?.roomNumber} &middot; {booking.guestCount ?? 1} guest
          {(booking.guestCount ?? 1) === 1 ? "" : "s"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleAction}
        disabled={submitting || alreadyDone}
        className={`btn-gold !px-4 !py-2 text-xs ${alreadyDone ? "!bg-available-bg !text-available-text !shadow-none" : ""}`}
      >
        {submitting && <Spinner size={12} tone="light" />}
        {alreadyDone ? (kind === "arrival" ? "Checked In" : "Checked Out") : kind === "arrival" ? "Check In" : "Check Out"}
      </button>
    </div>
  );
}

function WorkspaceColumn({ title, subtitle, bookings, kind, onDone }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-navy-950/8 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-navy-950">{title}</h2>
        <p className="text-xs text-navy-950/50">{subtitle}</p>
      </div>
      {bookings.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-navy-950/50">Nothing scheduled.</div>
      ) : (
        <div className="max-h-[28rem] overflow-y-auto">
          {bookings.map((booking) => (
            <GuestRow key={booking.id} booking={booking} kind={kind} onDone={onDone} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCheckInOutPage() {
  const { apiError } = useToast();
  const [date, setDate] = useState(toIsoDateString(new Date()));
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchCheckInOut(date)
      .then((result) => {
        setData(result);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load check-in/out data", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDone(bookingId, kind) {
    setData((current) => {
      if (!current) return current;
      const field = kind === "arrival" ? "arrivals" : "departures";
      const timestampField = kind === "arrival" ? "checkedInAt" : "checkedOutAt";
      return {
        ...current,
        [field]: current[field].map((b) =>
          b.id === bookingId ? { ...b, [timestampField]: new Date().toISOString() } : b,
        ),
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-surface flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="label-luxury" htmlFor="workspace-date">Workspace Date</label>
          <input
            id="workspace-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-luxury sm:w-56"
          />
        </div>
        <button
          type="button"
          onClick={() => setDate(toIsoDateString(new Date()))}
          className="btn-outline self-start sm:self-auto"
        >
          Jump to Today
        </button>
      </div>

      {status === "loading" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {status === "error" && <ErrorState message="We couldn't load the check-in/out workspace." onRetry={load} />}

      {status === "ready" && data && data.arrivals.length === 0 && data.departures.length === 0 && (
        <EmptyState title="Nothing scheduled" description={`No arrivals or departures on ${date}.`} />
      )}

      {status === "ready" && data && (data.arrivals.length > 0 || data.departures.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkspaceColumn
            title="Arrivals"
            subtitle={`${data.arrivals.length} guest${data.arrivals.length === 1 ? "" : "s"} checking in`}
            bookings={data.arrivals}
            kind="arrival"
            onDone={handleDone}
          />
          <WorkspaceColumn
            title="Departures"
            subtitle={`${data.departures.length} guest${data.departures.length === 1 ? "" : "s"} checking out`}
            bookings={data.departures}
            kind="departure"
            onDone={handleDone}
          />
        </div>
      )}
    </div>
  );
}
