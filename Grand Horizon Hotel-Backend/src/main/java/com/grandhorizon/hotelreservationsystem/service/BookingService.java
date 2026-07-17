package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.request.AdminUpdateBookingRequest;
import com.grandhorizon.hotelreservationsystem.dto.request.BookingRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.BookingResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.CheckInOutResponse;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    BookingResponse createBooking(String userEmail, BookingRequest request);

    BookingResponse getBookingById(Long id);

    List<BookingResponse> getBookingsForUser(String userEmail);

    /** Every booking in the system, newest first - for the admin master reservations table. */
    List<BookingResponse> getAllBookings();

    /** Non-cancelled arrivals and departures for the given date - the front-desk check-in/out workspace. */
    CheckInOutResponse getCheckInOutForDate(LocalDate date);

    BookingResponse checkInBooking(Long id);

    BookingResponse checkOutBooking(Long id);

    /** Admin-driven status transition (e.g. cancelling a booking from the Reservations table). */
    BookingResponse updateBookingStatus(Long id, BookingStatus status);

    /**
     * Full admin edit: status, dates, and room reassignment in one atomic
     * update. Re-validates the new date range against every OTHER booking
     * for the (possibly new) room, and recalculates totalAmount from the
     * new nights x the target room's current price.
     */
    BookingResponse adminUpdateBooking(Long id, AdminUpdateBookingRequest request);
}
