package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.dto.request.LoginRequest;
import com.grandhorizon.hotelreservationsystem.dto.request.RegisterRequest;
import com.grandhorizon.hotelreservationsystem.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
