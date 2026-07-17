package com.grandhorizon.hotelreservationsystem.controller;

import com.grandhorizon.hotelreservationsystem.dto.request.UpdateProfileRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.UserResponse;
import com.grandhorizon.hotelreservationsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;

/**
 * Self-service profile management for the currently authenticated admin.
 * Every route here acts on the caller's own account, resolved from the JWT
 * via {@link Principal} - there is no {id} path variable, since this is
 * "my settings," not general account administration (see
 * {@link AdminGuestController} for managing other accounts).
 */
@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getProfile(Principal principal) {
        return ResponseEntity.ok(userService.getOwnProfile(principal.getName()));
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @ModelAttribute UpdateProfileRequest request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            Principal principal) {
        return ResponseEntity.ok(userService.updateOwnProfile(principal.getName(), request, avatar));
    }
}
