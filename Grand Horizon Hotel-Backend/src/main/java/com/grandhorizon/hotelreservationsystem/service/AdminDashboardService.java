package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.response.DashboardStatsResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.DashboardSummaryResponse;

public interface AdminDashboardService {

    /**
     * Computes today's operational snapshot fresh from the database on
     * every call - no caching, no hardcoded figures.
     */
    DashboardStatsResponse getDashboardStats();

    /**
     * Broader snapshot for the Dashboard page's summary cards and donut
     * chart - revenue, guest count, occupancy rate, room-type distribution.
     */
    DashboardSummaryResponse getDashboardSummary();
}
