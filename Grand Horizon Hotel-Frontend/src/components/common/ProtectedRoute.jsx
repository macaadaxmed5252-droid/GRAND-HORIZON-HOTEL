import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useEffect, useRef } from "react";

/**
 * Gates a route behind authentication, and optionally behind `ROLE_ADMIN`.
 * Unauthenticated visitors are toasted and bounced to `/login` with the
 * originally-requested location preserved in router state, so LoginPage can
 * send them straight back after a successful sign-in.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { error } = useToast();
  const location = useLocation();
  const hasWarned = useRef(false);

  const authorized = requireAdmin ? isAuthenticated && isAdmin : isAuthenticated;

  useEffect(() => {
    if (!authorized && !hasWarned.current) {
      hasWarned.current = true;
      if (!isAuthenticated) {
        error("Authentication Required", "Please sign in to continue.");
      } else if (requireAdmin && !isAdmin) {
        error("Admins Only", "Your account doesn't have access to this area.");
      }
    }
  }, [authorized, isAuthenticated, isAdmin, requireAdmin, error]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
