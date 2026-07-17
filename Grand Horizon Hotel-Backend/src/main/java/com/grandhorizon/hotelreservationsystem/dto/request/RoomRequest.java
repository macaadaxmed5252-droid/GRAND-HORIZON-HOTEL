package com.grandhorizon.hotelreservationsystem.dto.request;

import com.grandhorizon.hotelreservationsystem.entity.RoomType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin-facing payload used to create or update a {@code Room}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequest {

    @NotBlank(message = "Room number is required")
    @Pattern(
            regexp = "^[A-Za-z0-9-]{2,20}$",
            message = "Room number must be 2-20 characters and may only contain letters, digits, and hyphens (e.g. \"101\" or \"DELUXE-1\")"
    )
    private String roomNumber;

    @NotNull(message = "Room type is required")
    private RoomType type;

    @NotNull(message = "Price per night is required")
    @DecimalMin(value = "0.01", message = "Price per night must be greater than zero")
    private BigDecimal pricePerNight;

    @NotBlank(message = "Title is required")
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z0-9\\s'-]*$",
            message = "Title must be text and cannot start with a number"
    )
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotEmpty(message = "At least one amenity is required")
    private List<String> amenities;

    // Deliberately optional: a newly-added room has no guest reviews yet, so
    // forcing a fabricated initial rating would misrepresent the room. When
    // a value IS supplied (e.g. on edit, after reviews accumulate), it must
    // fall within a valid 0-5 star range.
    @DecimalMin(value = "0", message = "Rating must be between 0 and 5")
    @DecimalMax(value = "5", message = "Rating must be between 0 and 5")
    private Double rating;
}
