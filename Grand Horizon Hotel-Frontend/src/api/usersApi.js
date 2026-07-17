/**
 * Self-service profile calls for the currently authenticated user (any
 * role). Mirrors the profile helpers in `./adminApi.js` exactly, but hits
 * `/api/users/profile` - reachable by any authenticated user, not just
 * admins (see the SecurityConfig carve-out ahead of the ADMIN-only
 * `/api/users/**` rule).
 */
import { apiClient, API_BASE_URL } from "./client";

/** Resolves a user's relative `profileImageUrl` (e.g. "/uploads/avatars/x.jpg") to a full URL. */
export function resolveAvatarUrl(profileImageUrl) {
  if (!profileImageUrl) return null;
  return `${API_BASE_URL}${profileImageUrl}`;
}

export function fetchOwnProfile() {
  return apiClient.get("/api/users/profile");
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
  return apiClient.putForm("/api/users/profile", formData);
}
