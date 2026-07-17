package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.request.UpdateProfileRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.GuestProfileResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.PageResponse;
import com.grandhorizon.hotelreservationsystem.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    /** {@code search} may be null/blank for no filtering - matches name or email, case-insensitive. */
    PageResponse<UserResponse> getGuestsPage(int page, int size, String search);

    GuestProfileResponse getGuestProfile(Long id);

    void deleteUserById(Long id);

    void deleteUserByEmail(String email);

    UserResponse getOwnProfile(String email);

    /** {@code avatar} may be null - the profile updates without touching the existing photo. */
    UserResponse updateOwnProfile(String email, UpdateProfileRequest request, MultipartFile avatar);
}
