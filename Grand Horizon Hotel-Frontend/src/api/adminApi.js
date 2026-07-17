/**
 * Single source of truth for every admin-only API call. Everything here
 * routes through `apiClient` (see `./client.js`), which already attaches
 * the JWT from localStorage to every request and normalizes both backend
 * error envelopes into one `ApiError` shape - so nothing in this file
 * touches headers or tokens directly.
 */
import { apiClient, API_BASE_URL } from "./client";

/** Resolves a user's relative `profileImageUrl` (e.g. "/uploads/avatars/x.jpg") to a full URL. */
export function resolveAvatarUrl(profileImageUrl) {
  if (!profileImageUrl) return null;
  return `${API_BASE_URL}${profileImageUrl}`;
}

// ---------- Dashboard & Reports ----------

/** @returns {Promise<{totalBookingsToday:number, roomsAvailable:number, totalRooms:number, checkInsToday:number, checkOutsToday:number, totalGuests:number, monthToDateRevenue:number, occupancyRateToday:number, roomTypeDistribution:Record<string,number>}>} */
export function fetchDashboardSummary() {
  return apiClient.get("/api/admin/dashboard/summary");
}

/** @param {"day"|"week"|"month"} range */
export function fetchRevenueReport(range = "day") {
  return apiClient.get(`/api/admin/reports/revenue?range=${range}`);
}

/** @param {"day"|"week"|"month"} range */
export function fetchOccupancyReport(range = "day") {
  return apiClient.get(`/api/admin/reports/occupancy?range=${range}`);
}

// ---------- Reservations & Check-in/out ----------

/** Every booking in the system, for the master reservations table. */
export function fetchAllReservations() {
  return apiClient.get("/api/admin/reservations");
}

/** @param {string} [isoDate] defaults to today on the backend when omitted */
export function fetchCheckInOut(isoDate) {
  const query = isoDate ? `?date=${isoDate}` : "";
  return apiClient.get(`/api/admin/check-in-out${query}`);
}

/** @param {"PENDING"|"CONFIRMED"|"CANCELLED"} status */
export function updateReservationStatus(bookingId, status) {
  return apiClient.put(`/api/admin/bookings/${bookingId}/status`, { status });
}

/**
 * Full edit sheet: status, dates, and room reassignment together.
 * @param {{status:string, checkInDate:string, checkOutDate:string, roomNumber:string}} fields
 */
export function updateBookingDetails(bookingId, fields) {
  return apiClient.put(`/api/admin/bookings/${bookingId}`, fields);
}

export function checkInBooking(bookingId) {
  return apiClient.put(`/api/admin/bookings/${bookingId}/check-in`);
}

export function checkOutBooking(bookingId) {
  return apiClient.put(`/api/admin/bookings/${bookingId}/check-out`);
}

// ---------- Guests ----------

/** @returns {Promise<{content:Array<object>, page:number, size:number, totalElements:number, totalPages:number}>} */
export function fetchGuestsPage({ page = 0, size = 10, search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.set("search", search);
  return apiClient.get(`/api/admin/guests?${params.toString()}`);
}

export function fetchGuestProfile(id) {
  return apiClient.get(`/api/admin/guests/${id}`);
}

export function deleteGuest(id) {
  return apiClient.del(`/api/admin/guests/${id}`);
}

// ---------- Settings (self profile) ----------

export function fetchOwnProfile() {
  return apiClient.get("/api/admin/settings/profile");
}

/**
 * @param {{name:string, phone:string}} fields
 * @param {File} [avatarFile] omit to leave the existing avatar untouched
 */
export function updateOwnProfile(fields, avatarFile) {
  const formData = new FormData();
  formData.append("name", fields.name ?? "");
  formData.append("phone", fields.phone ?? "");
  if (avatarFile) formData.append("avatar", avatarFile);
  return apiClient.putForm("/api/admin/settings/profile", formData);
}

export const PAYMENT_METHODS = ["CREDIT_CARD", "EVC_PLUS", "E_DAHAB"];
export const REPORT_RANGES = ["day", "week", "month"];
