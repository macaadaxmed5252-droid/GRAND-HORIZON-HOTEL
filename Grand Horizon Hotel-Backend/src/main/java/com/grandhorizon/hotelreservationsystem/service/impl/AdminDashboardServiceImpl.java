package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.dto.response.DashboardStatsResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.DashboardSummaryResponse;
import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import com.grandhorizon.hotelreservationsystem.entity.Role;
import com.grandhorizon.hotelreservationsystem.entity.Room;
import com.grandhorizon.hotelreservationsystem.repository.BookingRepository;
import com.grandhorizon.hotelreservationsystem.repository.RoomRepository;
import com.grandhorizon.hotelreservationsystem.repository.UserRepository;
import com.grandhorizon.hotelreservationsystem.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Computes admin dashboard statistics dynamically on every invocation.
 * "Rooms available" is deliberately derived from live booking date ranges
 * rather than the {@code Room.status} column - that column is set to
 * BOOKED at reservation time but nothing ever flips it back to AVAILABLE
 * once a stay's checkout date passes, so it would silently under-report
 * availability. Counting occupancy directly from the booking date range
 * for "today" avoids that drift entirely.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Override
    public DashboardStatsResponse getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);

        long totalBookingsToday = bookingRepository.countBookingsCreatedBetween(startOfDay, endOfDay);
        long checkInsToday = bookingRepository.countCheckInsOn(today, BookingStatus.CANCELLED);
        long checkOutsToday = bookingRepository.countCheckOutsOn(today, BookingStatus.CANCELLED);

        long totalRooms = roomRepository.countByIsDeletedFalse();
        long occupiedRooms = bookingRepository.countOccupiedRoomsOn(today, BookingStatus.CANCELLED);
        long roomsAvailable = Math.max(0, totalRooms - occupiedRooms);

        return DashboardStatsResponse.builder()
                .totalBookingsToday(totalBookingsToday)
                .roomsAvailable(roomsAvailable)
                .checkInsToday(checkInsToday)
                .checkOutsToday(checkOutsToday)
                .build();
    }

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        LocalDateTime startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth()).atStartOfDay();

        long totalBookingsToday = bookingRepository.countBookingsCreatedBetween(startOfDay, endOfDay);
        long checkInsToday = bookingRepository.countCheckInsOn(today, BookingStatus.CANCELLED);
        long checkOutsToday = bookingRepository.countCheckOutsOn(today, BookingStatus.CANCELLED);

        long totalRooms = roomRepository.countByIsDeletedFalse();
        long occupiedRooms = bookingRepository.countOccupiedRoomsOn(today, BookingStatus.CANCELLED);
        long roomsAvailable = Math.max(0, totalRooms - occupiedRooms);
        double occupancyRateToday = totalRooms == 0
                ? 0.0
                : BigDecimal.valueOf(occupiedRooms * 100.0 / totalRooms).setScale(2, RoundingMode.HALF_UP).doubleValue();

        long totalGuests = userRepository.countByRoleAndIsDeletedFalse(Role.ROLE_USER);

        BigDecimal monthToDateRevenue = bookingRepository.findByCreatedAtBetween(startOfMonth, LocalDateTime.now())
                .stream()
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> roomTypeDistribution = roomRepository.findByIsDeletedFalse().stream()
                .collect(Collectors.groupingBy(room -> room.getType().name(), Collectors.counting()));

        return DashboardSummaryResponse.builder()
                .totalBookingsToday(totalBookingsToday)
                .roomsAvailable(roomsAvailable)
                .totalRooms(totalRooms)
                .checkInsToday(checkInsToday)
                .checkOutsToday(checkOutsToday)
                .totalGuests(totalGuests)
                .monthToDateRevenue(monthToDateRevenue)
                .occupancyRateToday(occupancyRateToday)
                .roomTypeDistribution(roomTypeDistribution)
                .build();
    }
}
