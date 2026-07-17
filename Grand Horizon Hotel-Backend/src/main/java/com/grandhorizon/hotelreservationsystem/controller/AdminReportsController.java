package com.grandhorizon.hotelreservationsystem.controller;

import com.grandhorizon.hotelreservationsystem.dto.response.OccupancyPoint;
import com.grandhorizon.hotelreservationsystem.dto.response.RevenuePoint;
import com.grandhorizon.hotelreservationsystem.service.AdminReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Time-series metrics for the admin Reports page's charts.
 * Note: the corrected path is {@code /api/admin/reports/**} - the brief
 * this was built from listed one of these as {@code /api/api/reports/...},
 * which is a duplicated-segment typo; this follows the same, correct
 * {@code /api/admin/reports/**} prefix as the occupancy endpoint it was
 * paired with, for consistency.
 */
@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportsController {

    private final AdminReportsService adminReportsService;

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RevenuePoint>> getRevenue(@RequestParam(defaultValue = "day") String range) {
        return ResponseEntity.ok(adminReportsService.getRevenueTimeSeries(range));
    }

    @GetMapping("/occupancy")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OccupancyPoint>> getOccupancy(@RequestParam(defaultValue = "day") String range) {
        return ResponseEntity.ok(adminReportsService.getOccupancyTimeSeries(range));
    }
}
