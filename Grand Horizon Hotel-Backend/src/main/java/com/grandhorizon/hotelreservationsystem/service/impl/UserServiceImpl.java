package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.dto.request.UpdateProfileRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.BookingResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.GuestProfileResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.PageResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.UserResponse;
import com.grandhorizon.hotelreservationsystem.entity.BookingStatus;
import com.grandhorizon.hotelreservationsystem.entity.Role;
import com.grandhorizon.hotelreservationsystem.entity.User;
import com.grandhorizon.hotelreservationsystem.exception.LastAdminException;
import com.grandhorizon.hotelreservationsystem.exception.ResourceNotFoundException;
import com.grandhorizon.hotelreservationsystem.repository.UserRepository;
import com.grandhorizon.hotelreservationsystem.service.BookingService;
import com.grandhorizon.hotelreservationsystem.service.FileStorageService;
import com.grandhorizon.hotelreservationsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin-facing user management. Deletion is guarded so the last remaining
 * {@code ROLE_ADMIN} account can never be removed while the application is
 * running - the only way to lose all admins is to never have had one, which
 * {@code AdminSeeder} prevents on every startup.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final BookingService bookingService;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public PageResponse<UserResponse> getGuestsPage(int page, int size, String search) {
        PageRequest pageRequest = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("id").descending());

        var resultPage = StringUtils.hasText(search)
                ? userRepository.searchActiveByNameOrEmail(search, pageRequest)
                : userRepository.findByIsDeletedFalse(pageRequest);

        return PageResponse.from(resultPage.map(this::toResponse));
    }

    @Override
    public GuestProfileResponse getGuestProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        List<BookingResponse> bookings = bookingService.getBookingsForUser(user.getEmail());

        BigDecimal totalSpent = bookings.stream()
                .filter(booking -> !"CANCELLED".equals(booking.getStatus()))
                .map(BookingResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long activeBookingsCount = bookings.stream()
                .filter(booking -> BookingStatus.CONFIRMED.name().equals(booking.getStatus()))
                .count();

        return GuestProfileResponse.builder()
                .user(toResponse(user))
                .bookings(bookings)
                .totalSpent(totalSpent)
                .activeBookingsCount(activeBookingsCount)
                .build();
    }

    @Override
    @Transactional
    public void deleteUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        deleteUser(user);
    }

    @Override
    @Transactional
    public void deleteUserByEmail(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        deleteUser(user);
    }

    private void deleteUser(User user) {
        if (user.getRole() == Role.ROLE_ADMIN && userRepository.countByRole(Role.ROLE_ADMIN) <= 1) {
            throw new LastAdminException(
                    "Cannot delete '" + user.getEmail() + "' - they are the only remaining administrator. " +
                    "Promote another user to ROLE_ADMIN before deleting this account.");
        }

        // Soft delete via @SQLDelete on User (flips is_deleted=true instead
        // of physically removing the row) - so this is now always safe
        // regardless of booking history: the account can no longer log in
        // (see User.isEnabled()) or appear in guest listings, but its past
        // bookings keep resolving a valid user for revenue/guest reporting.
        userRepository.delete(user);
    }

    @Override
    public UserResponse getOwnProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateOwnProfile(String email, UpdateProfileRequest request, MultipartFile avatar) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        user.setName(request.getName());
        user.setPhone(request.getPhone());

        if (avatar != null && !avatar.isEmpty()) {
            String previousImageUrl = user.getProfileImageUrl();
            user.setProfileImageUrl(fileStorageService.storeAvatarImage(avatar));
            fileStorageService.deleteAvatarImage(previousImageUrl);
        }

        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
