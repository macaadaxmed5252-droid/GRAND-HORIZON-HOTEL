package com.grandhorizon.hotelreservationsystem.controller;

import com.grandhorizon.hotelreservationsystem.dto.response.GuestProfileResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.PageResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.UserResponse;
import com.grandhorizon.hotelreservationsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin guest management: paginated/searchable listing, full profile
 * (account + booking history + spend), and safe deletion. Deletion delegates
 * to {@code UserServiceImpl.deleteUserById}, which already guards against
 * removing the last admin and against removing a guest with bookings still
 * on record (409 GUEST_HAS_ACTIVE_BOOKINGS).
 */
@RestController
@RequestMapping("/api/admin/guests")
@RequiredArgsConstructor
public class AdminGuestController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> getGuests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getGuestsPage(page, size, search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GuestProfileResponse> getGuestProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getGuestProfile(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGuest(@PathVariable Long id) {
        userService.deleteUserById(id);
        return ResponseEntity.noContent().build();
    }
}
