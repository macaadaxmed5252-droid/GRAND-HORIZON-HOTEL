import { useEffect, useState } from "react";
import Modal from "../common/Modal";
import FormField from "../common/FormField";
import Spinner from "../common/Spinner";
import { createRoom, updateRoom, ROOM_TYPES } from "../../api/rooms";
import { useToast } from "../../context/ToastContext";
import { ApiError } from "../../api/client";
import { titleCase } from "../../utils/format";

const EMPTY_FORM = { roomNumber: "", type: ROOM_TYPES[0], pricePerNight: "", title: "", description: "", amenitiesText: "", rating: "" };

/** Blocks any keystroke that isn't a letter, digit, or hyphen. */
function roomNumberKeyDown(event) {
  if (event.key.length === 1 && !/[A-Za-z0-9-]/.test(event.key)) event.preventDefault();
}

/** Blocks any keystroke that isn't a digit or a single decimal point. */
function decimalKeyDown(event) {
  if (event.key.length !== 1) return;
  if (/[0-9]/.test(event.key)) return;
  if (event.key === "." && !event.currentTarget.value.includes(".")) return;
  event.preventDefault();
}

function toFormState(room) {
  if (!room) return EMPTY_FORM;
  return {
    roomNumber: room.roomNumber || "",
    type: room.type || ROOM_TYPES[0],
    pricePerNight: room.pricePerNight ?? "",
    title: room.title || "",
    description: room.description || "",
    amenitiesText: (room.amenities || []).join(", "),
    rating: room.rating ?? "",
  };
}

/** Shared create/edit form. `room` null => create mode; a RoomResponse => edit mode. */
export default function RoomFormModal({ open, room, onClose, onSaved }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(room);

  useEffect(() => {
    if (open) {
      setForm(toFormState(room));
      setImageFile(null);
      setFieldErrors({});
      setFormError("");
    }
  }, [open, room]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (!isEdit && !imageFile) {
      setFormError("A room photo is required when creating a new room.");
      return;
    }

    const amenities = form.amenitiesText.split(",").map((item) => item.trim()).filter(Boolean);
    const boundsErrors = {};
    if (amenities.length === 0) {
      boundsErrors.amenitiesText = "At least one amenity is required.";
    }
    if (!form.description.trim()) {
      boundsErrors.description = "Description is required.";
    }
    const price = Number(form.pricePerNight);
    if (!(price > 0)) {
      boundsErrors.pricePerNight = "Price per night must be greater than zero.";
    }
    if (form.rating !== "" && form.rating !== null && form.rating !== undefined) {
      const rating = Number(form.rating);
      if (!(rating >= 0 && rating <= 5)) {
        boundsErrors.rating = "Rating must be between 0 and 5.";
      }
    }
    if (Object.keys(boundsErrors).length > 0) {
      setFieldErrors(boundsErrors);
      return;
    }

    setSubmitting(true);
    try {
      const fields = {
        roomNumber: form.roomNumber.trim(),
        type: form.type,
        pricePerNight: form.pricePerNight,
        title: form.title.trim(),
        description: form.description.trim(),
        amenities,
        rating: form.rating,
      };

      const saved = isEdit ? await updateRoom(room.id, fields, imageFile) : await createRoom(fields, imageFile);

      success(isEdit ? "Room Updated" : "Room Added", `Room ${saved.roomNumber} has been saved.`);
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        toastError("Couldn't Save Room", err.message);
      } else {
        setFormError("Something went wrong while saving this room.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit Room ${room?.roomNumber}` : "Add a New Room"} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
            {formError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="room-form-number"
            label="Room Number"
            required
            pattern="^[A-Za-z0-9-]{2,20}$"
            onKeyDown={roomNumberKeyDown}
            value={form.roomNumber}
            onChange={(e) => updateField("roomNumber", e.target.value)}
            error={fieldErrors.roomNumber}
            hint='2-20 chars, letters/digits/hyphens, e.g. "DELUXE-1".'
          />
          <div>
            <label className="label-luxury" htmlFor="room-form-type">Room Type</label>
            <select
              id="room-form-type"
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="input-luxury"
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>{titleCase(type)}</option>
              ))}
            </select>
          </div>
          <FormField
            id="room-form-price"
            label="Price Per Night (USD)"
            type="text"
            inputMode="decimal"
            required
            onKeyDown={decimalKeyDown}
            value={form.pricePerNight}
            onChange={(e) => updateField("pricePerNight", e.target.value)}
            error={fieldErrors.pricePerNight}
            hint="Positive numbers only."
          />
          <FormField
            id="room-form-rating"
            label="Rating (optional)"
            type="text"
            inputMode="decimal"
            onKeyDown={decimalKeyDown}
            value={form.rating}
            onChange={(e) => updateField("rating", e.target.value)}
            error={fieldErrors.rating}
            hint="0-5, numbers only."
          />
        </div>

        <FormField
          id="room-form-title"
          label="Title"
          required
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          error={fieldErrors.title}
          hint="Can't start with a number."
        />
        <FormField
          id="room-form-description"
          label="Description"
          textarea
          required
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          error={fieldErrors.description}
        />
        <FormField
          id="room-form-amenities"
          label="Amenities (comma-separated)"
          required
          value={form.amenitiesText}
          onChange={(e) => updateField("amenitiesText", e.target.value)}
          error={fieldErrors.amenitiesText}
          placeholder="Free WiFi, Ocean View, Mini Bar"
        />

        <div>
          <label className="label-luxury" htmlFor="room-form-image">
            Room Photo {isEdit && <span className="font-normal normal-case text-navy-950/40">(leave blank to keep current photo)</span>}
          </label>
          <input
            id="room-form-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-navy-950/70 file:mr-4 file:rounded-full file:border-0 file:bg-navy-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all file:duration-300 file:ease-in-out hover:file:bg-navy-900"
          />
          <p className="mt-1.5 text-xs text-navy-950/40">JPEG, PNG, WEBP, or GIF — max 5MB.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold">
            {submitting && <Spinner size={16} tone="light" />}
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
