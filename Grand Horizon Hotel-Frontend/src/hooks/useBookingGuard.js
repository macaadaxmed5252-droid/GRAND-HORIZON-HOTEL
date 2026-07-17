import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/**
 * Shared "Book Now" click behavior for the Home showcase and the Rooms
 * explorer:
 *  - Signed out -> block the transition, show an "Authentication Required"
 *    toast, and redirect to /login, remembering the room the guest wanted
 *    so LoginPage can send them straight into the reservation flow after
 *    they sign in.
 *  - Signed in -> carry the selected room straight into the Reservation
 *    Details page via router state (no extra round trip to re-fetch it).
 */
export function useBookingGuard() {
  const { isAuthenticated } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  return useCallback(
    (room, dates) => {
      if (!isAuthenticated) {
        error("Authentication Required", "Please sign in or create an account to book a room.");
        navigate("/login", { state: { from: { pathname: "/reserve" }, room, dates } });
        return;
      }

      navigate("/reserve", { state: { room, dates } });
    },
    [isAuthenticated, error, navigate],
  );
}
