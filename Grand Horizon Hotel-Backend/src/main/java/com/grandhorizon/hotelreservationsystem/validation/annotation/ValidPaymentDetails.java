package com.grandhorizon.hotelreservationsystem.validation.annotation;

import com.grandhorizon.hotelreservationsystem.validation.validator.PaymentDetailsValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Class-level constraint applied to booking request payloads that expose a
 * {@code paymentMethod} and a {@code mobileMoneyNumber} property (via
 * standard getters). When {@code paymentMethod} is {@code EVC_PLUS} or
 * {@code E_DAHAB}, requires {@code mobileMoneyNumber} to be present and to
 * match that provider's Somali subscriber number format. Not applicable to
 * {@code CREDIT_CARD}, where no mobile money number is collected.
 */
@Documented
@Constraint(validatedBy = PaymentDetailsValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPaymentDetails {

    String message() default "Mobile money number is required and must match the selected provider's format";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
