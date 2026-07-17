package com.grandhorizon.hotelreservationsystem.dto.request;

import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidRoomNumber;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Admin edit-sheet payload for an existing booking: status, dates, and room
 * reassignment in one request. The frontend always sends the full current
 * (possibly unchanged) values for every field rather than a partial patch,
 * so there's no ambiguity between "field omitted" and "field cleared."
 * <p>
 * Deliberately does NOT reuse {@code @ValidCheckInCheckOut} (the guest
 * booking flow's date validator) - that rejects any date in the past, which
 * would block an admin from editing a booking that has already started or
 * fully elapsed. Ordering (check-in strictly before check-out) is still
 * enforced, just in the service layer, without the past-date restriction.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUpdateBookingRequest {

    @NotNull(message = "Status is required")
    private BookingStatus status;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    private LocalDate checkOutDate;

    @NotBlank(message = "Room number is required")
    @ValidRoomNumber
    private String roomNumber;
}
