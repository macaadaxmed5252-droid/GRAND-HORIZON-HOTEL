package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Flat, cycle-free projection of a {@code Room} for API responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {
    private Long id;
    private String roomNumber;
    private String type;
    private BigDecimal pricePerNight;
    private String status;
    private String title;
    private String description;
    private List<String> amenities;
    private Double rating;
    private String imageUrl;
}
