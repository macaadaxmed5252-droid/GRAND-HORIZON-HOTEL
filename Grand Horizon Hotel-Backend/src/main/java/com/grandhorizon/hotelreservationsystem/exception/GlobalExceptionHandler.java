package com.grandhorizon.hotelreservationsystem.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centralized exception handling for all REST controllers. Ensures the API
 * never leaks raw stack traces or letting Hibernate/JDBC exceptions reach
 * the client, and always returns a consistent, structured error payload -
 * every branch here is logged via SLF4J so failures are auditable from the
 * console without ever tearing down the embedded Tomcat instance, since
 * this advice runs inside the same request thread Spring already isolates
 * per-call exceptions to.
 * <p>
 * Every response carries a machine-readable {@code errorCode} alongside the
 * human-readable {@code message}, so frontend code can branch on outcome
 * (e.g. "was this a GUEST_HAS_ACTIVE_BOOKINGS conflict specifically?")
 * without parsing message text.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Formats {@code @Valid} field validation failures (on {@code @RequestBody}
     * and {@code @ModelAttribute} arguments) into a structured
     * {success, status, message, errorCode, errors} envelope with a 400 Bad
     * Request status. Logged at WARN with the full binding result - not a
     * stack trace, since a bad payload is an expected client mistake, not a
     * system fault.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex,
                                                                           HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn("Validation failed for request [{}]: {}", request.getRequestURI(), ex.getBindingResult());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildValidationBody(fieldErrors));
    }

    /**
     * Catches constraint violations on directly-annotated {@code @RequestParam}
     * / {@code @PathVariable} arguments (raised only on {@code @Validated}
     * controllers - none currently use this, but it's wired ahead of need so
     * adding one later doesn't also require touching this handler). Returns
     * the same validation envelope as the handler above.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex,
                                                                          HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            fieldErrors.put(extractFieldName(violation), violation.getMessage());
        }

        log.warn("Constraint violation for request [{}]: {}", request.getRequestURI(), fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(buildValidationBody(fieldErrors));
    }

    private String extractFieldName(ConstraintViolation<?> violation) {
        String propertyPath = violation.getPropertyPath().toString();
        int lastDot = propertyPath.lastIndexOf('.');
        return lastDot >= 0 ? propertyPath.substring(lastDot + 1) : propertyPath;
    }

    private Map<String, Object> buildValidationBody(Map<String, String> fieldErrors) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("message", "Validation Failed");
        body.put("errorCode", "VALIDATION_ERROR");
        body.put("errors", fieldErrors);
        return body;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage(), request);
    }

    @ExceptionHandler(RoomAlreadyBookedException.class)
    public ResponseEntity<ApiError> handleRoomAlreadyBooked(RoomAlreadyBookedException ex, HttpServletRequest request) {
        log.warn("Booking conflict on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "ROOM_ALREADY_BOOKED", ex.getMessage(), request);
    }

    @ExceptionHandler(LastAdminException.class)
    public ResponseEntity<ApiError> handleLastAdmin(LastAdminException ex, HttpServletRequest request) {
        log.warn("Blocked an operation that would remove the last admin on [{}]: {}",
                request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "LAST_ADMIN_ACCOUNT", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidBookingDatesException.class)
    public ResponseEntity<ApiError> handleInvalidBookingDates(InvalidBookingDatesException ex, HttpServletRequest request) {
        log.warn("Rejected an invalid booking date edit on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_DATES", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ApiError> handleInvalidFile(InvalidFileException ex, HttpServletRequest request) {
        log.warn("Rejected an invalid file upload on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "INVALID_FILE", ex.getMessage(), request);
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiError> handleFileStorage(FileStorageException ex, HttpServletRequest request) {
        log.error("File storage failure while processing request [{}]: {}",
                request.getRequestURI(), ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_STORAGE_ERROR",
                "Failed to process the uploaded file. Please try again.", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex,
                                                                 HttpServletRequest request) {
        log.warn("Rejected an oversized upload on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                "Uploaded file exceeds the maximum allowed size of 5MB", request);
    }

    /**
     * Catches database constraint violations (foreign key, unique, not-null)
     * surfaced by Hibernate/JDBC - e.g. deleting a room or user that still
     * has bookings referencing it. The detailed JDBC/SQL cause is logged
     * server-side only; the client gets a clean, generic conflict message
     * rather than a leaked constraint or column name.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrityViolation(DataIntegrityViolationException ex,
                                                                  HttpServletRequest request) {
        log.warn("Data integrity violation on [{}]: {}",
                request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return buildErrorResponse(HttpStatus.CONFLICT, "DATA_CONFLICT",
                "This operation could not be completed because it conflicts with existing related data.", request);
    }

    /**
     * Broader safety net for database connectivity/infrastructure failures
     * (timeouts, pool exhaustion, the database being temporarily
     * unreachable) that are not constraint violations. Mapped to 503 rather
     * than 500 since the condition is expected to be transient. Note this
     * only covers failures during request handling - it cannot help if the
     * database is unreachable at application startup, which is a distinct
     * concern addressed via HikariCP's initialization-fail-timeout setting
     * in application.properties instead.
     */
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiError> handleDataAccessException(DataAccessException ex, HttpServletRequest request) {
        log.error("Database access failure while processing request [{}]: {}",
                request.getRequestURI(), ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, "SERVICE_UNAVAILABLE",
                "The database is temporarily unavailable. Please try again shortly.", request);
    }

    /**
     * Catches invalid-credential failures raised by the authentication
     * manager during login so callers receive a 401 instead of falling
     * through to the generic 500 handler below. Deliberately does not log
     * the submitted email/password.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed on [{}]: {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password", request);
    }

    /**
     * Final safety net for anything not handled above. Logged at ERROR with
     * the full stack trace - if we ever land here, it's an unanticipated
     * bug worth investigating, not routine client behavior.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception occurred while processing request [{}]: {}",
                request.getRequestURI(), ex.getMessage(), ex);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again later.", request);
    }

    private ResponseEntity<ApiError> buildErrorResponse(HttpStatus status, String errorCode, String message,
                                                          HttpServletRequest request) {
        ApiError apiError = new ApiError(
                false,
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                errorCode,
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(status).body(apiError);
    }
}
