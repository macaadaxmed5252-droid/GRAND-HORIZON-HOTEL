package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.dto.request.AdminUpdateBookingRequest;
import com.grandhorizon.hotelreservationsystem.dto.request.BookingRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.BookingResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.CheckInOutResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.RoomResponse;
import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import com.grandhorizon.hotelreservationsystem.entity.GuestInfo;
import com.grandhorizon.hotelreservationsystem.entity.Room;
import com.grandhorizon.hotelreservationsystem.entity.RoomStatus;
import com.grandhorizon.hotelreservationsystem.entity.User;
import com.grandhorizon.hotelreservationsystem.exception.InvalidBookingDatesException;
import com.grandhorizon.hotelreservationsystem.exception.ResourceNotFoundException;
import com.grandhorizon.hotelreservationsystem.exception.RoomAlreadyBookedException;
import com.grandhorizon.hotelreservationsystem.repository.BookingRepository;
import com.grandhorizon.hotelreservationsystem.repository.RoomRepository;
import com.grandhorizon.hotelreservationsystem.repository.UserRepository;
import com.grandhorizon.hotelreservationsystem.service.BookingService;
import com.grandhorizon.hotelreservationsystem.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

/**
 * Core booking workflow: validates room availability against overlapping
 * reservations at the database level, persists the booking, flips the room
 * to BOOKED, and triggers invoice generation - all within a single
 * transaction.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final InvoiceService invoiceService;

    @Override
    public BookingResponse createBooking(String userEmail, BookingRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Room room = roomRepository.findByRoomNumber(request.getRoomNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Room not found with number: " + request.getRoomNumber()));

        // findByRoomNumber isn't filtered by isDeleted (unlike the room
        // listing queries), since it also has to resolve rooms for internal
        // lookups - so a soft-deleted room is checked explicitly here to
        // stop a stale/direct room number from being booked after deletion.
        if (room.isDeleted()) {
            throw new ResourceNotFoundException("Room not found with number: " + request.getRoomNumber());
        }

        List<Booking> overlaps = bookingRepository.findOverlappingBookings(
                room.getId(), request.getCheckInDate(), request.getCheckOutDate(), BookingStatus.CANCELLED);

        if (!overlaps.isEmpty()) {
            throw new RoomAlreadyBookedException(
                    "Room " + room.getRoomNumber() + " is already booked for the selected date range");
        }

        long totalNights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        BigDecimal totalAmount = room.getPricePerNight().multiply(BigDecimal.valueOf(totalNights));

        GuestInfo guestInfo = GuestInfo.builder()
                .guestFullName(request.getGuestFullName())
                .guestEmail(user.getEmail())
                .guestPhone(request.getGuestPhone())
                .specialRequests(request.getGuestNotes())
                .build();

        Booking booking = Booking.builder()
                .user(user)
                .room(room)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(request.getCheckOutDate())
                .totalAmount(totalAmount)
                .status(BookingStatus.CONFIRMED)
                .guestInfo(guestInfo)
                .passportId(request.getPassportId())
                .guestCount(request.getGuestCount())
                .paymentMethod(request.getPaymentMethod())
                .mobileMoneyNumber(request.getMobileMoneyNumber())
                .cardholderName(request.getCardPaymentDetails() != null ? request.getCardPaymentDetails().getCardholderName() : null)
                .cardLast4(request.getCardPaymentDetails() != null ? request.getCardPaymentDetails().getCardLast4() : null)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        room.setStatus(RoomStatus.BOOKED);
        roomRepository.save(room);

        invoiceService.generateInvoice(savedBooking);

        return toResponse(savedBooking, totalNights);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        return toResponse(booking, ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        return bookingRepository.findByUserId(user.getId()).stream()
                .map(booking -> toResponse(booking,
                        ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .sorted(Comparator.comparing(Booking::getCreatedAt).reversed())
                .map(booking -> toResponse(booking,
                        ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CheckInOutResponse getCheckInOutForDate(LocalDate date) {
        List<BookingResponse> arrivals = bookingRepository.findByCheckInDateAndStatusNot(date, BookingStatus.CANCELLED)
                .stream()
                .map(booking -> toResponse(booking,
                        ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate())))
                .toList();

        List<BookingResponse> departures = bookingRepository.findByCheckOutDateAndStatusNot(date, BookingStatus.CANCELLED)
                .stream()
                .map(booking -> toResponse(booking,
                        ChronoUnit.DAYS.between(booking.getCheckInDate(), booking.getCheckOutDate())))
                .toList();

        return CheckInOutResponse.builder().arrivals(arrivals).departures(departures).build();
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);

        // Cancelling frees the room immediately if today doesn't fall within
        // some OTHER non-cancelled booking's date range for the same room -
        // otherwise a stale AVAILABLE status would let a second guest book a
        // room another confirmed reservation still legitimately occupies.
        if (status == BookingStatus.CANCELLED) {
            refreshRoomAvailability(saved.getRoom());
        }

        return toResponse(saved, ChronoUnit.DAYS.between(saved.getCheckInDate(), saved.getCheckOutDate()));
    }

    @Override
    @Transactional
    public BookingResponse adminUpdateBooking(Long id, AdminUpdateBookingRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        if (!request.getCheckInDate().isBefore(request.getCheckOutDate())) {
            throw new InvalidBookingDatesException("Check-in date must be strictly before the check-out date");
        }

        Room previousRoom = booking.getRoom();
        Room targetRoom = request.getRoomNumber().equals(previousRoom.getRoomNumber())
                ? previousRoom
                : roomRepository.findByRoomNumber(request.getRoomNumber())
                        .filter(candidate -> !candidate.isDeleted())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Room not found with number: " + request.getRoomNumber()));

        List<Booking> overlaps = bookingRepository.findOverlappingBookingsExcludingBooking(
                targetRoom.getId(), id, request.getCheckInDate(), request.getCheckOutDate(), BookingStatus.CANCELLED);
        if (!overlaps.isEmpty()) {
            throw new RoomAlreadyBookedException(
                    "Room " + targetRoom.getRoomNumber() + " is already booked for the selected date range");
        }

        long totalNights = ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        boolean roomChanged = !targetRoom.getId().equals(previousRoom.getId());

        booking.setStatus(request.getStatus());
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setRoom(targetRoom);
        booking.setTotalAmount(targetRoom.getPricePerNight().multiply(BigDecimal.valueOf(totalNights)));

        Booking saved = bookingRepository.save(booking);

        // Both the vacated room (if reassigned away from) and the target
        // room may have just gained or lost today's occupancy - recompute
        // both rather than assuming which way status should flip.
        if (roomChanged) {
            refreshRoomAvailability(previousRoom);
        }
        refreshRoomAvailability(targetRoom);

        return toResponse(saved, totalNights);
    }

    /**
     * Sets the room to BOOKED if any non-cancelled booking covers today,
     * AVAILABLE otherwise - except a room an admin has deliberately put in
     * MAINTENANCE, which booking activity should never silently override.
     */
    private void refreshRoomAvailability(Room room) {
        if (room.getStatus() == RoomStatus.MAINTENANCE) {
            return;
        }
        List<Booking> occupyingToday = bookingRepository.findOverlappingBookings(
                room.getId(), LocalDate.now(), LocalDate.now().plusDays(1), BookingStatus.CANCELLED);
        RoomStatus nextStatus = occupyingToday.isEmpty() ? RoomStatus.AVAILABLE : RoomStatus.BOOKED;
        if (room.getStatus() != nextStatus) {
            room.setStatus(nextStatus);
            roomRepository.save(room);
        }
    }

    @Override
    @Transactional
    public BookingResponse checkInBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        booking.setCheckedInAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved, ChronoUnit.DAYS.between(saved.getCheckInDate(), saved.getCheckOutDate()));
    }

    @Override
    @Transactional
    public BookingResponse checkOutBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        booking.setCheckedOutAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved, ChronoUnit.DAYS.between(saved.getCheckInDate(), saved.getCheckOutDate()));
    }

    private BookingResponse toResponse(Booking booking, long totalNights) {
        Room room = booking.getRoom();
        RoomResponse roomResponse = RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .type(room.getType().name())
                .pricePerNight(room.getPricePerNight())
                .status(room.getStatus().name())
                .title(room.getTitle())
                .description(room.getDescription())
                .amenities(room.getAmenities())
                .rating(room.getRating())
                // Previously omitted here, so every booking's embedded room summary
                // silently lost its photo even though GET /api/rooms included it.
                .imageUrl(room.getImageUrl())
                .build();

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingReference(generateBookingReference(booking.getId()))
                .room(roomResponse)
                .guestFullName(booking.getGuestInfo().getGuestFullName())
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .totalNights(totalNights)
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus().name())
                .passportId(booking.getPassportId())
                .guestCount(booking.getGuestCount())
                .paymentMethod(booking.getPaymentMethod() != null ? booking.getPaymentMethod().name() : null)
                .mobileMoneyNumber(booking.getMobileMoneyNumber())
                .cardholderName(booking.getCardholderName())
                .cardLast4(booking.getCardLast4())
                .checkedInAt(booking.getCheckedInAt())
                .checkedOutAt(booking.getCheckedOutAt())
                .build();
    }

    private String generateBookingReference(Long bookingId) {
        return String.format("GH-BK-%06d", bookingId);
    }
}
