package com.grandhorizon.hotelreservationsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an operation would remove the last remaining {@code ROLE_ADMIN}
 * account, which would lock every admin out of the system.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class LastAdminException extends RuntimeException {

    public LastAdminException(String message) {
        super(message);
    }
}
