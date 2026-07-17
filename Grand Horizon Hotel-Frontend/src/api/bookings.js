import { apiClient } from "./client";

/**
 * @param {{
 *   roomNumber: string, checkInDate: string, checkOutDate: string,
 *   guestFullName: string, guestPhone: string,
 *   guestNotes?: string, passportId?: string, guestCount: number,
 *   paymentMethod: "CREDIT_CARD"|"EVC_PLUS"|"E_DAHAB",
 *   mobileMoneyNumber?: string,
 *   cardPaymentDetails?: { cardholderName: string, cardLast4: string },
 * }} payload
 * Dates must be ISO `yyyy-MM-dd` strings. There is no `roomId` field on the
 * backend's BookingRequest — rooms are referenced by their `roomNumber`.
 * `guestFullName`, `guestPhone`, `guestCount`, and `paymentMethod` are
 * required by the backend; `passportId` and `guestNotes` are optional.
 * `mobileMoneyNumber` is required when `paymentMethod` is `EVC_PLUS` or
 * `E_DAHAB`; `cardPaymentDetails` is required when `paymentMethod` is
 * `CREDIT_CARD` (all validated server-side by `@ValidPaymentDetails`).
 * `cardPaymentDetails` deliberately carries only the last 4 digits — the
 * full card number, CVC, and expiry are validated client-side and never
 * sent here.
 * @returns {Promise<object>} BookingResponse
 */
export function createBooking(payload) {
  return apiClient.post("/api/bookings/book", payload);
}

export function fetchBookingById(id) {
  return apiClient.get(`/api/bookings/${id}`);
}

/** Bookings belonging to the currently authenticated caller. */
export function fetchMyBookings() {
  return apiClient.get("/api/bookings/my-bookings");
}

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"];
