package com.grandhorizon.hotelreservationsystem.validation.annotation;

import com.grandhorizon.hotelreservationsystem.validation.validator.UniqueEmailValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Field-level constraint that ensures an email address is not already
 * registered in the system. Backed by a database lookup via {@link UserRepository}.
 */
@Documented
@Constraint(validatedBy = UniqueEmailValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface UniqueEmail {

    String message() default "An account with this email address already exists";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
