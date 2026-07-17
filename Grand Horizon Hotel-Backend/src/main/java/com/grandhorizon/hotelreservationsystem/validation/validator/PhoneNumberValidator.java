package com.grandhorizon.hotelreservationsystem.validation.validator;

import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidPhoneNumber;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validates telephone numbers against international E.164-style formats.
 * Accepts numbers such as {@code +252611234567} (Somalia) or any other
 * standard international format beginning with a '+' and country code.
 */
public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    // General E.164 format: '+' followed by 8-15 digits, not starting with 0 after the '+'.
    private static final Pattern E164_PATTERN = Pattern.compile("^\\+[1-9]\\d{7,14}$");

    // Somali-specific format: +252 followed by a 9-digit subscriber number (e.g. +252611234567).
    private static final Pattern SOMALI_PATTERN = Pattern.compile("^\\+252(6[0-9]|9[0-9])\\d{7}$");

    @Override
    public void initialize(ValidPhoneNumber constraintAnnotation) {
        // No initialization required.
    }

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }
        String trimmed = phoneNumber.trim();
        return SOMALI_PATTERN.matcher(trimmed).matches() || E164_PATTERN.matcher(trimmed).matches();
    }
}
