package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Complete guest profile for the admin "view guest" panel: account details
 * plus their full booking history and a spend summary.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestProfileResponse {
    private UserResponse user;
    private List<BookingResponse> bookings;
    private BigDecimal totalSpent;
    private long activeBookingsCount;
}
