package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.response.OccupancyPoint;
import com.grandhorizon.hotelreservationsystem.dto.response.RevenuePoint;

import java.util.List;

public interface AdminReportsService {

    /**
     * @param range "day" (last 30 days), "week" (last 12 weeks), or "month"
     *              (last 12 months) - defaults to "day" for any other value.
     */
    List<RevenuePoint> getRevenueTimeSeries(String range);

    /** Same {@code range} semantics as {@link #getRevenueTimeSeries}. */
    List<OccupancyPoint> getOccupancyTimeSeries(String range);
}
