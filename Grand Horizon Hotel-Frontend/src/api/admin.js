import { apiClient } from "./client";

/**
 * @returns {Promise<{ totalBookingsToday: number, roomsAvailable: number, checkInsToday: number, checkOutsToday: number }>}
 */
export function fetchDashboardStats() {
  return apiClient.get("/api/admin/dashboard-stats");
}
