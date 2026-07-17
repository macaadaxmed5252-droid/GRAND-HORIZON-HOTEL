package com.grandhorizon.hotelreservationsystem.validation.annotation;

import com.grandhorizon.hotelreservationsystem.validation.validator.CheckInCheckOutValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Class-level constraint applied to booking request payloads that expose a
 * {@code checkInDate} and a {@code checkOutDate} property (via standard
 * getters). Ensures the check-in date is strictly before the check-out date
 * and that neither date lies in the past.
 */
@Documented
@Constraint(validatedBy = CheckInCheckOutValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCheckInCheckOut {

    String message() default "Check-in date must be today or later and strictly before the check-out date";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
