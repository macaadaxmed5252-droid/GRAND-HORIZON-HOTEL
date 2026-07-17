package com.grandhorizon.hotelreservationsystem.dto.request;

import com.grandhorizon.hotelreservationsystem.entity.Role;
import com.grandhorizon.hotelreservationsystem.validation.annotation.UniqueEmail;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin-facing payload for directly creating or editing a user account,
 * including its {@link Role} - as opposed to public self-registration via
 * {@link RegisterRequest}, which always forces {@code ROLE_USER}.
 * <p>
 * Not currently bound to any controller endpoint; provided so the same
 * strict field-level rules as {@link RegisterRequest} are available the
 * moment an admin-managed create/edit-user route is added.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    @NotBlank(message = "Name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Name must contain only alphabetic characters and spaces")
    @Size(min = 3, max = 50, message = "Name must be between 3 and 50 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address structure")
    @UniqueEmail
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!()_\\-{}\\[\\]:;\"'<>,.?/~`|\\\\]).{8,}$",
            message = "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character"
    )
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^(\\+252(6[0-9]|9[0-9])\\d{7}|\\+[1-9]\\d{7,14})$",
            message = "Please provide a valid phone number format"
    )
    private String phone;

    @NotNull(message = "Role is required")
    private Role role;
}
