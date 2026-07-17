package com.grandhorizon.hotelreservationsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an admin edits a booking's dates such that check-in is not
 * strictly before check-out. Unlike the guest-facing booking flow's
 * {@code @ValidCheckInCheckOut}, this deliberately does NOT also reject
 * past dates, since admins need to be able to edit bookings that have
 * already started or fully elapsed.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidBookingDatesException extends RuntimeException {

    public InvalidBookingDatesException(String message) {
        super(message);
    }
}
