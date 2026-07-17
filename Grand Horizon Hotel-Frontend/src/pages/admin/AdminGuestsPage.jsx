import { useCallback, useEffect, useRef, useState } from "react";
import { fetchGuestsPage, fetchGuestProfile, deleteGuest } from "../../api/adminApi";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import Spinner, { FullPageSpinner } from "../../components/common/Spinner";
import { EyeIcon, PrintIcon, TrashIcon } from "../../components/admin/icons";
import GuestBookingHistoryChart from "../../components/admin/charts/GuestBookingHistoryChart";
import { formatCurrency, formatDate, titleCase } from "../../utils/format";
import { downloadGuestStatementPdf } from "../../utils/guestStatementPdf";
import { ApiError } from "../../api/client";

const PAGE_SIZE = 10;

/** Passport/ID lives per-booking (a guest may book under a different ID each stay), so the profile view shows the most recent one on record. */
function mostRecentPassportId(bookings) {
  const withPassport = bookings.find((booking) => booking.passportId);
  return withPassport?.passportId ?? null;
}

function GuestProfileModal({ guestId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  const { apiError } = useToast();

  useEffect(() => {
    if (!guestId) return;
    setStatus("loading");
    fetchGuestProfile(guestId)
      .then((data) => {
        setProfile(data);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load guest profile", err);
      });
  }, [guestId, apiError]);

  return (
    <Modal open={Boolean(guestId)} onClose={onClose} title="Guest Profile" maxWidth="max-w-2xl">
      {status === "loading" && <FullPageSpinner label="Loading profile…" />}
      {status === "error" && <ErrorState message="We couldn't load this guest's profile." />}
      {status === "ready" && profile && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800/8 text-lg font-semibold text-navy-800">
              {profile.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-navy-950">{profile.user.name}</p>
              <p className="text-sm text-navy-950/50">{profile.user.email}</p>
              <p className="text-xs text-navy-950/40">{profile.user.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Passport / ID</p>
              <p className="mt-1 font-medium text-navy-950">{mostRecentPassportId(profile.bookings) || "Not provided"}</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Joined</p>
              <p className="mt-1 font-medium text-navy-950">{formatDate(profile.user.createdAt)}</p>
            </div>
            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-950/45">Role</p>
              <p className="mt-1 font-medium text-navy-950">{titleCase(profile.user.role?.replace("ROLE_", ""))}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface p-4 text-center">
              <p className="font-display text-xl font-semibold text-navy-950">{formatCurrency(profile.totalSpent)}</p>
              <p className="mt-0.5 text-xs text-navy-950/50">Total Spent</p>
            </div>
            <div className="rounded-xl bg-surface p-4 text-center">
              <p className="font-display text-xl font-semibold text-navy-950">{profile.activeBookingsCount}</p>
              <p className="mt-0.5 text-xs text-navy-950/50">Active Bookings</p>
            </div>
            <div className="rounded-xl bg-surface p-4 text-center">
              <p className="font-display text-xl font-semibold text-navy-950">{profile.bookings.length}</p>
              <p className="mt-0.5 text-xs text-navy-950/50">Total Bookings</p>
            </div>
          </div>

          {profile.bookings.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-950/45">Spend by Reservation</h3>
              <div className="rounded-xl border border-navy-950/8 p-3">
                <GuestBookingHistoryChart bookings={profile.bookings} />
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-navy-950/45">Booking History</h3>
            {profile.bookings.length === 0 ? (
              <p className="text-sm text-navy-950/50">No bookings on record.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-navy-950/8">
                {profile.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 border-b border-navy-950/5 px-4 py-3 text-sm last:border-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-950">{booking.bookingReference}</p>
                      <p className="text-xs text-navy-950/50">
                        {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-medium text-navy-950">{formatCurrency(booking.totalAmount)}</span>
                      <StatusBadge status={booking.status} kind="booking" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function DeleteGuestModal({ guest, onClose, onDeleted }) {
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  async function handleConfirm() {
    setSubmitting(true);
    setConflictMessage("");
    try {
      await deleteGuest(guest.id);
      success("Guest Deleted", `${guest.name} has been removed.`);
      onDeleted(guest.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // GUEST_HAS_ACTIVE_BOOKINGS or LAST_ADMIN_ACCOUNT — shown inline in
        // the modal (not just a toast) since the admin needs to actually
        // read and act on this before trying again.
        setConflictMessage(err.message);
      } else {
        toastError("Delete Failed", err.message || "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(guest)} onClose={onClose} title="Delete Guest" maxWidth="max-w-md">
      {guest && (
        <div className="space-y-4">
          <p className="text-sm text-navy-950/70">
            Are you sure you want to permanently delete <span className="font-semibold text-navy-950">{guest.name}</span> (
            {guest.email})? This cannot be undone.
          </p>

          {conflictMessage && (
            <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
              {conflictMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-occupied-text px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.02] disabled:opacity-50"
            >
              {submitting && <Spinner size={16} tone="light" />}
              Delete Permanently
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminGuestsPage() {
  const { apiError } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [profileGuestId, setProfileGuestId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  async function handlePrintStatement(guestId) {
    setPrintingId(guestId);
    try {
      const profile = await fetchGuestProfile(guestId);
      downloadGuestStatementPdf(profile);
    } catch (err) {
      apiError("Couldn't generate statement", err);
    } finally {
      setPrintingId(null);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchGuestsPage({ page, size: PAGE_SIZE, search })
      .then((data) => {
        setPageData(data);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load guests", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleted(id) {
    setPageData((current) =>
      current ? { ...current, content: current.content.filter((g) => g.id !== id) } : current,
    );
  }

  if (status === "error") {
    return <ErrorState message="We couldn't load guest records." onRetry={load} />;
  }

  return (
    <div className="space-y-5">
      <div className="card-surface p-5">
        <label className="label-luxury" htmlFor="guest-search">Search Guests</label>
        <input
          id="guest-search"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          className="input-luxury sm:w-96"
        />
      </div>

      {status === "loading" && <SkeletonTable rows={PAGE_SIZE} columns={5} />}

      {status === "ready" && pageData && pageData.content.length === 0 && (
        <EmptyState title="No guests found" description={search ? "Try a different search term." : "No guests have registered yet."} />
      )}

      {status === "ready" && pageData && pageData.content.length > 0 && (
        <>
          <div className="card-surface overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy-950/8 text-xs font-semibold uppercase tracking-wider text-navy-950/45">
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.content.map((guest) => (
                  <tr
                    key={guest.id}
                    className="cursor-pointer border-b border-navy-950/5 transition-colors duration-300 ease-in-out last:border-0 hover:bg-surface"
                    onClick={() => setProfileGuestId(guest.id)}
                  >
                    <td className="px-5 py-4 font-medium text-navy-950">{guest.name}</td>
                    <td className="px-5 py-4 text-navy-950/70">{guest.email}</td>
                    <td className="px-5 py-4 text-navy-950/70">{guest.phone}</td>
                    <td className="px-5 py-4 text-navy-950/70">{titleCase(guest.role?.replace("ROLE_", ""))}</td>
                    <td className="px-5 py-4 text-navy-950/70">{formatDate(guest.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileGuestId(guest.id);
                          }}
                          title="View profile"
                          aria-label={`View profile for ${guest.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-800/70 transition-colors duration-300 ease-in-out hover:bg-navy-950/6 hover:text-navy-800"
                        >
                          <EyeIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintStatement(guest.id);
                          }}
                          disabled={printingId === guest.id}
                          title="Print statement"
                          aria-label={`Print statement for ${guest.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-navy-800/70 transition-colors duration-300 ease-in-out hover:bg-navy-950/6 hover:text-navy-800 disabled:opacity-40"
                        >
                          {printingId === guest.id ? <Spinner size={16} /> : <PrintIcon className="h-4.5 w-4.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(guest);
                          }}
                          title="Delete guest"
                          aria-label={`Delete ${guest.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-occupied-text/80 transition-colors duration-300 ease-in-out hover:bg-occupied-bg hover:text-occupied-text"
                        >
                          <TrashIcon className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-navy-950/60">
            <p>
              Page {pageData.page + 1} of {Math.max(pageData.totalPages, 1)} &middot; {pageData.totalElements} total guests
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageData.page === 0}
                className="btn-outline !px-4 !py-2 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
                disabled={pageData.page + 1 >= pageData.totalPages}
                className="btn-outline !px-4 !py-2 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <GuestProfileModal guestId={profileGuestId} onClose={() => setProfileGuestId(null)} />
      <DeleteGuestModal guest={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </div>
  );
}
