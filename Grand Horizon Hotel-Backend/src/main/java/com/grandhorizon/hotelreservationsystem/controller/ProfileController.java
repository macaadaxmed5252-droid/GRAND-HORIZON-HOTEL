package com.grandhorizon.hotelreservationsystem.controller;

import com.grandhorizon.hotelreservationsystem.dto.request.UpdateProfileRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.UserResponse;
import com.grandhorizon.hotelreservationsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

/**
 * Self-service profile management for the currently authenticated guest
 * (any role). Every route here acts on the caller's own account, resolved
 * from the JWT via {@link Principal} - mirrors {@link AdminSettingsController}
 * exactly, but lives under {@code /api/users/profile} and is reachable by
 * any authenticated user rather than {@code ROLE_ADMIN} only (see the
 * {@code /api/users/profile} carve-out in {@code SecurityConfig}, declared
 * ahead of the blanket {@code /api/users/**} admin-only rule).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Principal principal) {
        return ResponseEntity.ok(userService.getOwnProfile(principal.getName()));
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @ModelAttribute UpdateProfileRequest request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            Principal principal) {
        return ResponseEntity.ok(userService.updateOwnProfile(principal.getName(), request, avatar));
    }
}
