/**
 * Thin fetch wrapper for the Grand Horizon Hotel backend.
 *
 * Responsibilities:
 *  - Prefix every call with the API base URL.
 *  - Attach the cached JWT (if any) to every request automatically.
 *  - Normalize the two distinct error shapes the backend returns
 *    (the validation-failure envelope, and the generic ApiError envelope)
 *    into one `ApiError` class the rest of the app can handle uniformly.
 *  - Surface network failures (backend unreachable, CORS blocked) as a
 *    clear message instead of an opaque "Failed to fetch".
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5252";

const TOKEN_STORAGE_KEY = "ghh_token";

/**
 * Thrown for every non-2xx response. `fieldErrors` is populated only when
 * the backend returned the `{ status, message, errors }` validation
 * envelope (e.g. from a bad register/room-creation payload); otherwise it
 * is null and `message` carries the backend's ApiError message. `errorCode`
 * is the machine-readable code (e.g. "GUEST_HAS_ACTIVE_BOOKINGS") present on
 * every backend error response - branch on this instead of parsing
 * `message` text when the UI needs to react to a specific failure kind.
 */
export class ApiError extends Error {
  constructor(message, status, fieldErrors = null, errorCode = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.errorCode = errorCode;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function buildHeaders(isJsonBody, extraHeaders) {
  const headers = { Accept: "application/json", ...extraHeaders };
  if (isJsonBody) headers["Content-Type"] = "application/json";

  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function toApiError(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Body wasn't JSON (e.g. a plain-text 403 from the servlet container
    // itself, before it ever reached GlobalExceptionHandler).
  }

  if (payload && payload.errors && typeof payload.errors === "object") {
    // { success, status, message: "Validation Failed", errorCode, errors: { field: message } }
    return new ApiError(payload.message || "Validation failed", response.status, payload.errors, payload.errorCode);
  }

  if (payload && payload.message) {
    // { success, timestamp, status, error, errorCode, message, path }
    return new ApiError(payload.message, response.status, null, payload.errorCode);
  }

  return new ApiError(response.statusText || "Request failed", response.status, null);
}

async function request(path, { method = "GET", body, isMultipart = false, headers } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(!isMultipart && body !== undefined, headers),
      body: isMultipart ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${API_BASE_URL}. Confirm the backend is running and that it allows requests from this origin (CORS).`,
      0,
    );
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response;
}

export const apiClient = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),
  postForm: (path, formData) => request(path, { method: "POST", body: formData, isMultipart: true }),
  putForm: (path, formData) => request(path, { method: "PUT", body: formData, isMultipart: true }),

  /**
   * Fetches a binary response (e.g. the invoice PDF) with the auth header
   * attached, since a plain `<a href>` can't carry an Authorization header.
   * Returns the raw Response so callers can read headers (filename) or the
   * blob body as needed.
   */
  async getBinary(path) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: "GET",
        headers: buildHeaders(false),
      });
    } catch {
      throw new ApiError(
        `Could not reach the server at ${API_BASE_URL}. Confirm the backend is running and that it allows requests from this origin (CORS).`,
        0,
      );
    }
    if (!response.ok) {
      throw await toApiError(response);
    }
    return response;
  },
};
