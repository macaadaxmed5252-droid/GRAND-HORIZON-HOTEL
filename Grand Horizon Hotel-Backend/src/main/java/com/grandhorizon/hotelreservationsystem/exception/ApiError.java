package com.grandhorizon.hotelreservationsystem.exception;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * Uniform error body returned by {@link GlobalExceptionHandler} for all
 * non-validation failures. {@code success} and {@code errorCode} let a
 * client branch on outcome/type programmatically without parsing
 * {@code message} text; {@code status}/{@code error}/{@code timestamp}/
 * {@code path} are kept for logging and human debugging.
 */
public record ApiError(
        boolean success,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime timestamp,
        int status,
        String error,
        String errorCode,
        String message,
        String path
) {
}
