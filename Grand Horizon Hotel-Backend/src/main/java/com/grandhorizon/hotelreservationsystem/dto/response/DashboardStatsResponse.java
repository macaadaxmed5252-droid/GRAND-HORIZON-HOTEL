package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Real-time snapshot of hotel operations for the admin dashboard, computed
 * fresh from {@code LocalDate.now()} on every request - nothing here is
 * cached or hardcoded.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {
    private long totalBookingsToday;
    private long roomsAvailable;
    private long checkInsToday;
    private long checkOutsToday;
}
