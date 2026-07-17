package com.grandhorizon.hotelreservationsystem.dto.response;

import java.time.LocalDate;

/** One bucket of the occupancy time-series chart (day/week/month granularity). */
public record OccupancyPoint(String label, LocalDate bucketStart, double occupancyRate) {
}
