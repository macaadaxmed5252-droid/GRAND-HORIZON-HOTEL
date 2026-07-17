import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRooms, deleteRoom, resolveRoomImageUrl } from "../../api/rooms";
import { useToast } from "../../context/ToastContext";
import { SkeletonTable } from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import ImageWithFallback from "../../components/common/ImageWithFallback";
import Spinner from "../../components/common/Spinner";
import RoomFormModal from "../../components/admin/RoomFormModal";
import { formatCurrency, titleCase } from "../../utils/format";
import { ApiError } from "../../api/client";

function DeleteRoomModal({ room, onClose, onDeleted }) {
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  async function handleConfirm() {
    setSubmitting(true);
    setConflictMessage("");
    try {
      await deleteRoom(room.id);
      success("Room Deleted", `Room ${room.roomNumber} has been removed.`);
      onDeleted(room.id);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConflictMessage(err.message);
      } else {
        toastError("Delete Failed", err.message || "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={Boolean(room)} onClose={onClose} title="Delete Room" maxWidth="max-w-md">
      {room && (
        <div className="space-y-4">
          <p className="text-sm text-navy-950/70">
            Are you sure you want to permanently delete <span className="font-semibold text-navy-950">Room {room.roomNumber}</span>? This cannot be undone.
          </p>
          {conflictMessage && (
            <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
              {conflictMessage}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
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

export default function AdminRoomsPage() {
  const { apiError } = useToast();
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState("loading");
  const [formState, setFormState] = useState({ open: false, room: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadRef = useRef(() => {});

  const load = useCallback(() => {
    setStatus("loading");
    fetchRooms()
      .then((data) => {
        setRooms(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err) => {
        setStatus("error");
        apiError("Couldn't load rooms", err, () => loadRef.current());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(saved) {
    setRooms((current) => {
      const exists = current.some((r) => r.id === saved.id);
      return exists ? current.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...current];
    });
  }

  function handleDeleted(id) {
    setRooms((current) => current.filter((r) => r.id !== id));
  }

  if (status === "loading") return <SkeletonTable rows={6} columns={5} />;
  if (status === "error") return <ErrorState message="We couldn't load the room inventory." onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button type="button" onClick={() => setFormState({ open: true, room: null })} className="btn-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          title="No rooms yet"
          description="Add your first room to start building the inventory guests will see."
          action={
            <button type="button" onClick={() => setFormState({ open: true, room: null })} className="btn-gold">
              Add Room
            </button>
          }
        />
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-950/8 text-xs font-semibold uppercase tracking-wider text-navy-950/45">
                <th className="px-5 py-3.5">Room</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Rating</th>
                <th className="px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-navy-950/5 transition-colors duration-300 ease-in-out last:border-0 hover:bg-surface">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={resolveRoomImageUrl(room.imageUrl)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                        fallbackIconClassName="h-5 w-5"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-navy-950">{room.title || `Room ${room.roomNumber}`}</p>
                        <p className="text-xs text-navy-950/40">Room {room.roomNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-navy-950/70">{titleCase(room.type)}</td>
                  <td className="px-5 py-3 font-medium text-navy-950">{formatCurrency(room.pricePerNight)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={room.status} kind="room" />
                  </td>
                  <td className="px-5 py-3 text-navy-950/70">{room.rating ? room.rating.toFixed(1) : "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormState({ open: true, room })}
                        className="text-xs font-semibold text-navy-800 transition-opacity duration-300 ease-in-out hover:opacity-70"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(room)}
                        className="text-xs font-semibold text-occupied-text transition-opacity duration-300 ease-in-out hover:opacity-70"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RoomFormModal
        open={formState.open}
        room={formState.room}
        onClose={() => setFormState({ open: false, room: null })}
        onSaved={handleSaved}
      />
      <DeleteRoomModal room={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </div>
  );
}
