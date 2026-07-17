package com.grandhorizon.hotelreservationsystem.validation.annotation;

import com.grandhorizon.hotelreservationsystem.validation.validator.RoomNumberValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Field-level constraint validating that a supplied room number corresponds
 * to an existing {@code Room} record in the database.
 */
@Documented
@Constraint(validatedBy = RoomNumberValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidRoomNumber {

    String message() default "The specified room number does not exist";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
