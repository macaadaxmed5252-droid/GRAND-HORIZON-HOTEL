package com.grandhorizon.hotelreservationsystem.validation.validator;

import com.grandhorizon.hotelreservationsystem.repository.RoomRepository;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidRoomNumber;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Validates that a room number provided in an incoming request corresponds
 * to an existing, persisted {@code Room}. Registered as a Spring bean so the
 * {@link RoomRepository} can be injected for the existence check.
 */
@Component
@RequiredArgsConstructor
public class RoomNumberValidator implements ConstraintValidator<ValidRoomNumber, String> {

    private final RoomRepository roomRepository;

    @Override
    public void initialize(ValidRoomNumber constraintAnnotation) {
        // No initialization required.
    }

    @Override
    public boolean isValid(String roomNumber, ConstraintValidatorContext context) {
        if (roomNumber == null || roomNumber.isBlank()) {
            // Absence/blank checks are the responsibility of @NotBlank.
            return true;
        }
        return roomRepository.existsByRoomNumber(roomNumber.trim());
    }
}
