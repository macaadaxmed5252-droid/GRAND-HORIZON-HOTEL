package com.grandhorizon.hotelreservationsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a room is requested for a date range that overlaps an
 * existing, non-cancelled booking.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class RoomAlreadyBookedException extends RuntimeException {

    public RoomAlreadyBookedException(String message) {
        super(message);
    }
}
