package com.grandhorizon.hotelreservationsystem.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One bucket of the revenue time-series chart (day/week/month granularity). */
public record RevenuePoint(String label, LocalDate bucketStart, BigDecimal revenue) {
}
