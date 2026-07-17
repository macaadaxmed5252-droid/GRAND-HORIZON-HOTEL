package com.grandhorizon.hotelreservationsystem.repository;

import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    long countByUserId(Long userId);

    List<Booking> findByRoomId(Long roomId);

    long countByRoomId(Long roomId);

    List<Booking> findByStatus(BookingStatus status);

    /**
     * Returns any bookings for the given room that overlap the requested
     * date range and are not in the excluded status (typically CANCELLED).
     * Two date ranges [checkIn, checkOut) overlap when the existing booking's
     * check-in is before the requested check-out AND the existing booking's
     * check-out is after the requested check-in. This single indexed query
     * (on room_id) is used to enforce no-double-booking at the database
     * level before a new reservation is persisted.
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.room.id = :roomId
              AND b.status <> :excludedStatus
              AND b.checkInDate < :checkOutDate
              AND b.checkOutDate > :checkInDate
            """)
    List<Booking> findOverlappingBookings(@Param("roomId") Long roomId,
                                           @Param("checkInDate") LocalDate checkInDate,
                                           @Param("checkOutDate") LocalDate checkOutDate,
                                           @Param("excludedStatus") BookingStatus excludedStatus);

    /**
     * Same overlap check as {@link #findOverlappingBookings}, but excludes a
     * specific booking id. Used when updating an existing booking's dates so
     * the booking does not conflict with itself.
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.room.id = :roomId
              AND b.id <> :bookingId
              AND b.status <> :excludedStatus
              AND b.checkInDate < :checkOutDate
              AND b.checkOutDate > :checkInDate
            """)
    List<Booking> findOverlappingBookingsExcludingBooking(@Param("roomId") Long roomId,
                                                            @Param("bookingId") Long bookingId,
                                                            @Param("checkInDate") LocalDate checkInDate,
                                                            @Param("checkOutDate") LocalDate checkOutDate,
                                                            @Param("excludedStatus") BookingStatus excludedStatus);

    /**
     * Counts bookings recorded (created) within a half-open day window,
     * i.e. "bookings made today" for the admin dashboard. Driven by
     * {@code [startOfDay, endOfDay)} bounds computed from LocalDate.now() in
     * the service layer, rather than a database-specific date-truncation
     * function, so it behaves identically regardless of the JDBC driver.
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :startOfDay AND b.createdAt < :endOfDay")
    long countBookingsCreatedBetween(@Param("startOfDay") LocalDateTime startOfDay,
                                      @Param("endOfDay") LocalDateTime endOfDay);

    /**
     * Counts non-cancelled bookings whose check-in date is exactly today.
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.checkInDate = :today AND b.status <> :excludedStatus")
    long countCheckInsOn(@Param("today") LocalDate today, @Param("excludedStatus") BookingStatus excludedStatus);

    /**
     * Counts non-cancelled bookings whose check-out date is exactly today.
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.checkOutDate = :today AND b.status <> :excludedStatus")
    long countCheckOutsOn(@Param("today") LocalDate today, @Param("excludedStatus") BookingStatus excludedStatus);

    /**
     * Counts distinct rooms currently occupied by a non-cancelled booking on
     * the given date, using the same half-open [checkInDate, checkOutDate)
     * convention as {@link #findOverlappingBookings} so "occupied" agrees
     * exactly with the double-booking guard elsewhere in the system.
     */
    @Query("""
            SELECT COUNT(DISTINCT b.room.id) FROM Booking b
            WHERE b.status <> :excludedStatus
              AND b.checkInDate <= :today
              AND b.checkOutDate > :today
            """)
    long countOccupiedRoomsOn(@Param("today") LocalDate today, @Param("excludedStatus") BookingStatus excludedStatus);

    /** Non-cancelled bookings arriving on the given date - the "arrivals" list for the check-in/out workspace. */
    List<Booking> findByCheckInDateAndStatusNot(LocalDate checkInDate, BookingStatus excludedStatus);

    /** Non-cancelled bookings departing on the given date - the "departures" list for the check-in/out workspace. */
    List<Booking> findByCheckOutDateAndStatusNot(LocalDate checkOutDate, BookingStatus excludedStatus);

    /** All bookings created within a window, for the revenue time-series report. */
    List<Booking> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
