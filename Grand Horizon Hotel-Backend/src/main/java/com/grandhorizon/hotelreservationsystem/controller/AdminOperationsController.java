package com.grandhorizon.hotelreservationsystem.controller;

import com.grandhorizon.hotelreservationsystem.dto.request.AdminUpdateBookingRequest;
import com.grandhorizon.hotelreservationsystem.dto.request.UpdateBookingStatusRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.BookingResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.CheckInOutResponse;
import com.grandhorizon.hotelreservationsystem.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin-only operational endpoints: the master reservations table and the
 * front-desk check-in/check-out workspace. Every route requires
 * {@code ROLE_ADMIN}, enforced both by {@code SecurityConfig}'s
 * {@code /api/admin/**} URL rule and, here, again via {@code @PreAuthorize}.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminOperationsController {

    private final BookingService bookingService;

    @GetMapping("/reservations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllReservations() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/check-in-out")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CheckInOutResponse> getCheckInOut(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getCheckInOutForDate(date != null ? date : LocalDate.now()));
    }

    @PutMapping("/bookings/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateBookingStatusRequest request) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, request.getStatus()));
    }

    /** Full edit sheet: status, dates, and room reassignment together. */
    @PutMapping("/bookings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateBooking(@PathVariable Long id,
                                                           @Valid @RequestBody AdminUpdateBookingRequest request) {
        return ResponseEntity.ok(bookingService.adminUpdateBooking(id, request));
    }

    @PutMapping("/bookings/{id}/check-in")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> checkIn(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.checkInBooking(id));
    }

    @PutMapping("/bookings/{id}/check-out")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> checkOut(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.checkOutBooking(id));
    }
}
