import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, register as registerRequest } from "../api/auth";
import { setStoredToken, clearStoredToken } from "../api/client";
import { fetchOwnProfile } from "../api/usersApi";

const AUTH_STORAGE_KEY = "ghh_auth";
const AuthContext = createContext(null);

function readStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.expirationTime && new Date(parsed.expirationTime).getTime() <= Date.now()) {
      // Token already expired — don't resurrect a dead session on reload.
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());
  // Richer self profile (name, phone, avatar) - fetched separately from the
  // auth token/role, since login/register responses don't carry it. Absent
  // until the fetch resolves; the navbar falls back to the raw email until then.
  const [profile, setProfile] = useState(null);

  // Keep the API client's cached token in sync with whatever auth state we hold.
  useEffect(() => {
    if (auth?.token) {
      setStoredToken(auth.token);
    } else {
      clearStoredToken();
    }
  }, [auth]);

  const isAuthenticated = Boolean(auth?.token);

  const refreshProfile = useCallback(() => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    fetchOwnProfile()
      .then(setProfile)
      .catch(() => {
        // Non-critical: the navbar/settings screens fall back to the raw
        // email when no profile is loaded, so a failed fetch here is not a
        // blocking error worth surfacing as a toast.
        setProfile(null);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const persist = useCallback((authResponse) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authResponse));
    setAuth(authResponse);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const response = await loginRequest({ email, password });
      persist(response);
      return response;
    },
    [persist],
  );

  const register = useCallback(
    async (fields) => {
      const response = await registerRequest(fields);
      persist(response);
      return response;
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      user: auth ? { email: auth.email, role: auth.role } : null,
      profile,
      refreshProfile,
      token: auth?.token ?? null,
      isAuthenticated,
      isAdmin: auth?.role === "ROLE_ADMIN",
      login,
      register,
      logout,
    }),
    [auth, profile, refreshProfile, isAuthenticated, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with its Provider
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
