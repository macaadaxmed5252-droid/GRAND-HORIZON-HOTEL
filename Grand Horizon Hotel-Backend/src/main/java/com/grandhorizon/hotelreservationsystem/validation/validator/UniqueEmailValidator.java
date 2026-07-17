package com.grandhorizon.hotelreservationsystem.validation.validator;

import com.grandhorizon.hotelreservationsystem.repository.UserRepository;
import com.grandhorizon.hotelreservationsystem.validation.annotation.UniqueEmail;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Validates that the supplied email address does not already exist in the
 * database. Registered as a Spring bean so the {@link UserRepository} can be
 * injected, allowing this validator to perform a live database lookup.
 */
@Component
@RequiredArgsConstructor
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    private final UserRepository userRepository;

    @Override
    public void initialize(UniqueEmail constraintAnnotation) {
        // No initialization required.
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.isBlank()) {
            // Absence/blank checks are the responsibility of @NotBlank.
            return true;
        }
        return !userRepository.existsByEmail(email.trim().toLowerCase());
    }
}
