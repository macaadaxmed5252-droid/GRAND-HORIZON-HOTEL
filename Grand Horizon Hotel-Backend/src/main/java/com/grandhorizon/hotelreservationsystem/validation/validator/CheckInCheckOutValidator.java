package com.grandhorizon.hotelreservationsystem.validation.validator;

import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidCheckInCheckOut;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.NotReadablePropertyException;

import java.time.LocalDate;

/**
 * Class-level validator applied to any booking request DTO that exposes
 * {@code checkInDate} and {@code checkOutDate} properties (of type
 * {@link LocalDate}) via standard JavaBean getters.
 * <p>
 * Rules enforced:
 * <ul>
 *     <li>Both dates must be present.</li>
 *     <li>Neither date may be in the past (today is allowed).</li>
 *     <li>{@code checkInDate} must be strictly before {@code checkOutDate}.</li>
 * </ul>
 * Uses Spring's {@link BeanWrapper} to read the properties reflectively so
 * this single validator can be reused across any booking request payload
 * without coupling this validation module to a specific DTO class.
 */
public class CheckInCheckOutValidator implements ConstraintValidator<ValidCheckInCheckOut, Object> {

    private static final String CHECK_IN_PROPERTY = "checkInDate";
    private static final String CHECK_OUT_PROPERTY = "checkOutDate";

    @Override
    public void initialize(ValidCheckInCheckOut constraintAnnotation) {
        // No initialization required.
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        final LocalDate checkInDate;
        final LocalDate checkOutDate;
        try {
            BeanWrapper beanWrapper = new BeanWrapperImpl(value);
            Object checkIn = beanWrapper.getPropertyValue(CHECK_IN_PROPERTY);
            Object checkOut = beanWrapper.getPropertyValue(CHECK_OUT_PROPERTY);

            if (!(checkIn instanceof LocalDate) && checkIn != null) {
                return true; // Not applicable to this type; let other constraints handle it.
            }
            if (!(checkOut instanceof LocalDate) && checkOut != null) {
                return true;
            }

            checkInDate = (LocalDate) checkIn;
            checkOutDate = (LocalDate) checkOut;
        } catch (NotReadablePropertyException ex) {
            // The target class does not expose the expected properties; nothing to validate here.
            return true;
        }

        if (checkInDate == null || checkOutDate == null) {
            // Presence is the responsibility of @NotNull on the individual fields.
            return true;
        }

        LocalDate today = LocalDate.now();
        boolean datesInFuture = !checkInDate.isBefore(today) && !checkOutDate.isBefore(today);
        boolean checkInBeforeCheckOut = checkInDate.isBefore(checkOutDate);

        if (datesInFuture && checkInBeforeCheckOut) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        if (!checkInBeforeCheckOut) {
            context.buildConstraintViolationWithTemplate("Check-in date must be strictly before the check-out date")
                    .addPropertyNode(CHECK_IN_PROPERTY)
                    .addConstraintViolation();
        }
        if (!datesInFuture) {
            context.buildConstraintViolationWithTemplate("Check-in and check-out dates cannot be in the past")
                    .addPropertyNode(CHECK_IN_PROPERTY)
                    .addConstraintViolation();
        }
        return false;
    }
}
