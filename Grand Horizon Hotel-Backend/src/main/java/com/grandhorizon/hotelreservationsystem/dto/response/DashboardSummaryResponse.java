package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Broader operational snapshot for the admin Dashboard page's summary
 * cards and donut chart - a superset of {@link DashboardStatsResponse},
 * which remains unchanged for backward compatibility.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private long totalBookingsToday;
    private long roomsAvailable;
    private long totalRooms;
    private long checkInsToday;
    private long checkOutsToday;
    private long totalGuests;
    /** Sum of non-cancelled bookings created since the 1st of the current calendar month. */
    private BigDecimal monthToDateRevenue;
    /** Percentage (0-100) of rooms occupied today. */
    private double occupancyRateToday;
    /** Room count grouped by RoomType, for the room-type distribution donut chart. */
    private Map<String, Long> roomTypeDistribution;
}
