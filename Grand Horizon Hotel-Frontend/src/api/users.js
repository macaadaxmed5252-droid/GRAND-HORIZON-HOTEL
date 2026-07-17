import { apiClient } from "./client";

/** Admin only. Returns every registered account (never includes a password). */
export function fetchAllUsers() {
  return apiClient.get("/api/users");
}

/** Admin only. */
export function deleteUser(id) {
  return apiClient.del(`/api/users/${id}`);
}
