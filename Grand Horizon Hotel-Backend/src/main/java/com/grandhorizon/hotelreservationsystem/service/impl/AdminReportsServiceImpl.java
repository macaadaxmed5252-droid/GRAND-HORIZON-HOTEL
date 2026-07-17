package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.dto.response.OccupancyPoint;
import com.grandhorizon.hotelreservationsystem.dto.response.RevenuePoint;
import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import com.grandhorizon.hotelreservationsystem.repository.BookingRepository;
import com.grandhorizon.hotelreservationsystem.repository.RoomRepository;
import com.grandhorizon.hotelreservationsystem.service.AdminReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Time-series aggregation for the admin Reports page. Bucketing is done in
 * Java over a bounded window (30 days / 12 weeks / 12 months) rather than
 * with database-specific date-truncation SQL, consistent with the rest of
 * this codebase's portable-JPQL-over-driver-specific-functions preference.
 * The occupancy report in particular issues one query per day in the
 * window (up to ~31 for a month-granularity request) - acceptable at this
 * application's scale, but the first thing to revisit if this endpoint
 * ever needs to serve high query volume.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportsServiceImpl implements AdminReportsService {

    private static final int DAY_BUCKETS = 30;
    private static final int WEEK_BUCKETS = 12;
    private static final int MONTH_BUCKETS = 12;

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("MMM d");
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMM yyyy");

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;

    @Override
    public List<RevenuePoint> getRevenueTimeSeries(String range) {
        String normalized = normalizeRange(range);
        return switch (normalized) {
            case "week" -> revenueByWeek();
            case "month" -> revenueByMonth();
            default -> revenueByDay();
        };
    }

    @Override
    public List<OccupancyPoint> getOccupancyTimeSeries(String range) {
        long totalRooms = roomRepository.countByIsDeletedFalse();
        if (totalRooms == 0) {
            return List.of();
        }

        String normalized = normalizeRange(range);
        return switch (normalized) {
            case "week" -> occupancyByWeek(totalRooms);
            case "month" -> occupancyByMonth(totalRooms);
            default -> occupancyByDay(totalRooms);
        };
    }

    private String normalizeRange(String range) {
        if ("week".equalsIgnoreCase(range) || "month".equalsIgnoreCase(range)) {
            return range.toLowerCase();
        }
        return "day";
    }

    // ---------- Revenue ----------

    private List<RevenuePoint> revenueByDay() {
        LocalDate today = LocalDate.now();
        Map<LocalDate, BigDecimal> totals = new LinkedHashMap<>();
        for (int i = DAY_BUCKETS - 1; i >= 0; i--) {
            totals.put(today.minusDays(i), BigDecimal.ZERO);
        }

        for (Booking booking : nonCancelledBookingsSince(today.minusDays(DAY_BUCKETS - 1).atStartOfDay())) {
            LocalDate day = booking.getCreatedAt().toLocalDate();
            totals.computeIfPresent(day, (d, current) -> current.add(booking.getTotalAmount()));
        }

        return totals.entrySet().stream()
                .map(e -> new RevenuePoint(e.getKey().format(DAY_LABEL), e.getKey(), e.getValue()))
                .toList();
    }

    private List<RevenuePoint> revenueByWeek() {
        LocalDate currentWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        Map<LocalDate, BigDecimal> totals = new LinkedHashMap<>();
        for (int i = WEEK_BUCKETS - 1; i >= 0; i--) {
            totals.put(currentWeekStart.minusWeeks(i), BigDecimal.ZERO);
        }

        LocalDate windowStart = currentWeekStart.minusWeeks(WEEK_BUCKETS - 1L);
        for (Booking booking : nonCancelledBookingsSince(windowStart.atStartOfDay())) {
            LocalDate weekStart = booking.getCreatedAt().toLocalDate().with(DayOfWeek.MONDAY);
            totals.computeIfPresent(weekStart, (d, current) -> current.add(booking.getTotalAmount()));
        }

        return totals.entrySet().stream()
                .map(e -> new RevenuePoint("Week of " + e.getKey().format(DAY_LABEL), e.getKey(), e.getValue()))
                .toList();
    }

    private List<RevenuePoint> revenueByMonth() {
        YearMonth currentMonth = YearMonth.now();
        Map<YearMonth, BigDecimal> totals = new LinkedHashMap<>();
        for (int i = MONTH_BUCKETS - 1; i >= 0; i--) {
            totals.put(currentMonth.minusMonths(i), BigDecimal.ZERO);
        }

        LocalDate windowStart = currentMonth.minusMonths(MONTH_BUCKETS - 1L).atDay(1);
        for (Booking booking : nonCancelledBookingsSince(windowStart.atStartOfDay())) {
            YearMonth month = YearMonth.from(booking.getCreatedAt());
            totals.computeIfPresent(month, (m, current) -> current.add(booking.getTotalAmount()));
        }

        return totals.entrySet().stream()
                .map(e -> new RevenuePoint(e.getKey().format(MONTH_LABEL), e.getKey().atDay(1), e.getValue()))
                .toList();
    }

    private List<Booking> nonCancelledBookingsSince(LocalDateTime windowStart) {
        return bookingRepository.findByCreatedAtBetween(windowStart, LocalDateTime.now()).stream()
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .toList();
    }

    // ---------- Occupancy ----------

    private double occupancyRateFor(LocalDate date, long totalRooms) {
        long occupied = bookingRepository.countOccupiedRoomsOn(date, BookingStatus.CANCELLED);
        return BigDecimal.valueOf(occupied * 100.0 / totalRooms).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private List<OccupancyPoint> occupancyByDay(long totalRooms) {
        LocalDate today = LocalDate.now();
        List<OccupancyPoint> points = new ArrayList<>();
        for (int i = DAY_BUCKETS - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            points.add(new OccupancyPoint(date.format(DAY_LABEL), date, occupancyRateFor(date, totalRooms)));
        }
        return points;
    }

    private List<OccupancyPoint> occupancyByWeek(long totalRooms) {
        LocalDate currentWeekStart = LocalDate.now().with(DayOfWeek.MONDAY);
        LocalDate today = LocalDate.now();
        List<OccupancyPoint> points = new ArrayList<>();

        for (int i = WEEK_BUCKETS - 1; i >= 0; i--) {
            LocalDate weekStart = currentWeekStart.minusWeeks(i);
            points.add(new OccupancyPoint(
                    "Week of " + weekStart.format(DAY_LABEL), weekStart, averageOccupancyOverRange(weekStart, weekStart.plusDays(6), today, totalRooms)));
        }
        return points;
    }

    private List<OccupancyPoint> occupancyByMonth(long totalRooms) {
        YearMonth currentMonth = YearMonth.now();
        LocalDate today = LocalDate.now();
        List<OccupancyPoint> points = new ArrayList<>();

        for (int i = MONTH_BUCKETS - 1; i >= 0; i--) {
            YearMonth month = currentMonth.minusMonths(i);
            LocalDate monthStart = month.atDay(1);
            LocalDate monthEnd = month.atEndOfMonth();
            points.add(new OccupancyPoint(
                    month.format(MONTH_LABEL), monthStart, averageOccupancyOverRange(monthStart, monthEnd, today, totalRooms)));
        }
        return points;
    }

    private double averageOccupancyOverRange(LocalDate rangeStart, LocalDate rangeEnd, LocalDate today, long totalRooms) {
        LocalDate cappedEnd = rangeEnd.isAfter(today) ? today : rangeEnd;
        if (cappedEnd.isBefore(rangeStart)) {
            return 0.0;
        }

        double sum = 0;
        int count = 0;
        for (LocalDate date = rangeStart; !date.isAfter(cappedEnd); date = date.plusDays(1)) {
            sum += occupancyRateFor(date, totalRooms);
            count++;
        }
        return count == 0 ? 0.0 : BigDecimal.valueOf(sum / count).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
