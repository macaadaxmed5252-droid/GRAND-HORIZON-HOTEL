package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Front-desk operational view for a single date: who is arriving and who is
 * departing, so admin staff can process check-ins/check-outs without paging
 * through the full reservations table.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInOutResponse {
    private List<BookingResponse> arrivals;
    private List<BookingResponse> departures;
}
