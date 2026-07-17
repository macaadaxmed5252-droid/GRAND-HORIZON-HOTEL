package com.grandhorizon.hotelreservationsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when an otherwise-valid uploaded file cannot be persisted to disk
 * (I/O failure, permissions, disk full, ...). Distinct from
 * {@link InvalidFileException}, which covers client-caused problems.
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
