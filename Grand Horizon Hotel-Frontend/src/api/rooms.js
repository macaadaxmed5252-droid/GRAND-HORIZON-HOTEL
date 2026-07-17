import { apiClient, API_BASE_URL } from "./client";

/**
 * @param {{ type?: string, status?: string }} filters
 * @returns {Promise<Array<object>>} RoomResponse[]
 */
export function fetchRooms(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  const query = params.toString();
  return apiClient.get(`/api/rooms${query ? `?${query}` : ""}`);
}

export function fetchRoomById(id) {
  return apiClient.get(`/api/rooms/${id}`);
}

/**
 * Builds the multipart/form-data payload the backend's `@ModelAttribute
 * RoomRequest` + `@RequestParam("image") MultipartFile` expect. `amenities`
 * must be appended once per item (not as a single comma-joined string) so
 * Spring binds it into a List<String>.
 *
 * @param {{
 *   roomNumber: string, type: string, pricePerNight: string|number,
 *   title?: string, description?: string, amenities?: string[], rating?: string|number,
 * }} fields
 * @param {File} imageFile
 */
function buildRoomFormData(fields, imageFile) {
  const formData = new FormData();
  formData.append("roomNumber", fields.roomNumber ?? "");
  formData.append("type", fields.type ?? "");
  formData.append("pricePerNight", String(fields.pricePerNight ?? ""));
  if (fields.title) formData.append("title", fields.title);
  if (fields.description) formData.append("description", fields.description);
  (fields.amenities || []).filter(Boolean).forEach((item) => formData.append("amenities", item));
  if (fields.rating !== undefined && fields.rating !== "") {
    formData.append("rating", String(fields.rating));
  }
  if (imageFile) formData.append("image", imageFile);
  return formData;
}

/** Admin only. `image` is required by the backend on create. */
export function createRoom(fields, imageFile) {
  return apiClient.postForm("/api/rooms", buildRoomFormData(fields, imageFile));
}

/** Admin only. `image` is optional on update — omit to keep the existing photo. */
export function updateRoom(id, fields, imageFile) {
  return apiClient.putForm(`/api/rooms/${id}`, buildRoomFormData(fields, imageFile));
}

/** Admin only. */
export function deleteRoom(id) {
  return apiClient.del(`/api/rooms/${id}`);
}

/** Resolves a room's relative `imageUrl` (e.g. "/uploads/rooms/x.jpg") to a full URL. */
export function resolveRoomImageUrl(imageUrl) {
  if (!imageUrl) return null;
  return `${API_BASE_URL}${imageUrl}`;
}

export const ROOM_TYPES = ["SINGLE", "DOUBLE", "TWIN", "DELUXE", "SUITE", "FAMILY"];
export const ROOM_STATUSES = ["AVAILABLE", "BOOKED", "MAINTENANCE"];
