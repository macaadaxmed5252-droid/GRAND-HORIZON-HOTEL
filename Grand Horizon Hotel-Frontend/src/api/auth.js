import { apiClient } from "./client";

/**
 * @param {{ name: string, email: string, password: string, phone: string }} payload
 * @returns {Promise<{ token: string, email: string, role: "ROLE_USER"|"ROLE_ADMIN", expirationTime: string }>}
 */
export function register(payload) {
  return apiClient.post("/api/auth/register", payload);
}

/**
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ token: string, email: string, role: "ROLE_USER"|"ROLE_ADMIN", expirationTime: string }>}
 */
export function login(payload) {
  return apiClient.post("/api/auth/login", payload);
}
