package com.grandhorizon.hotelreservationsystem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Self-service profile update for the currently authenticated user (guest
 * or admin - see {@link com.grandhorizon.hotelreservationsystem.controller.ProfileController}
 * and {@link com.grandhorizon.hotelreservationsystem.controller.AdminSettingsController}).
 * Email, password, and role are deliberately not editable here - this is a
 * profile-details form, not full account management.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Name must contain only alphabetic characters and spaces")
    @Size(min = 3, max = 50, message = "Name must be between 3 and 50 characters")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^(\\+252(6[0-9]|9[0-9])\\d{7}|\\+[1-9]\\d{7,14})$",
            message = "Please provide a valid phone number format"
    )
    private String phone;
}
