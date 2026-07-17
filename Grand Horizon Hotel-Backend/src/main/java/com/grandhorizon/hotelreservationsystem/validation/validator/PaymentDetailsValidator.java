package com.grandhorizon.hotelreservationsystem.validation.validator;

import com.grandhorizon.hotelreservationsystem.dto.request.CardPaymentDetails;
import com.grandhorizon.hotelreservationsystem.entity.PaymentMethod;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidPaymentDetails;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.NotReadablePropertyException;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * Class-level validator applied to any booking request DTO that exposes
 * {@code paymentMethod} and {@code mobileMoneyNumber} properties via
 * standard JavaBean getters. Uses Spring's {@link BeanWrapper} to read the
 * properties reflectively, matching the approach already established by
 * {@link CheckInCheckOutValidator} for this codebase's other cross-field
 * booking constraints.
 */
public class PaymentDetailsValidator implements ConstraintValidator<ValidPaymentDetails, Object> {

    // EVC Plus: 61XXXXXXX (9 digits) or 25261XXXXXXX (country code + 9 digits).
    private static final Pattern EVC_PLUS_PATTERN = Pattern.compile("^(61\\d{7}|25261\\d{7})$");

    // E-Dahab: 62XXXXXXX (9 digits) or 25262XXXXXXX (country code + 9 digits).
    private static final Pattern E_DAHAB_PATTERN = Pattern.compile("^(62\\d{7}|25262\\d{7})$");

    private static final Pattern LAST4_PATTERN = Pattern.compile("^\\d{4}$");

    private static final String PAYMENT_METHOD_PROPERTY = "paymentMethod";
    private static final String MOBILE_MONEY_NUMBER_PROPERTY = "mobileMoneyNumber";
    private static final String CARD_PAYMENT_DETAILS_PROPERTY = "cardPaymentDetails";

    @Override
    public void initialize(ValidPaymentDetails constraintAnnotation) {
        // No initialization required.
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        final Object paymentMethod;
        final Object mobileMoneyNumber;
        final Object cardPaymentDetails;
        try {
            BeanWrapper beanWrapper = new BeanWrapperImpl(value);
            paymentMethod = beanWrapper.getPropertyValue(PAYMENT_METHOD_PROPERTY);
            mobileMoneyNumber = beanWrapper.getPropertyValue(MOBILE_MONEY_NUMBER_PROPERTY);
            cardPaymentDetails = beanWrapper.getPropertyValue(CARD_PAYMENT_DETAILS_PROPERTY);
        } catch (NotReadablePropertyException ex) {
            return true;
        }

        if (!(paymentMethod instanceof PaymentMethod method)) {
            return true; // Presence is the responsibility of @NotNull on the field itself.
        }

        return switch (method) {
            case CREDIT_CARD -> validateCard(cardPaymentDetails, context);
            case EVC_PLUS -> validateMobileMoney(mobileMoneyNumber, EVC_PLUS_PATTERN, context,
                    "Enter a valid EVC Plus number (61XXXXXXX or 25261XXXXXXX)");
            case E_DAHAB -> validateMobileMoney(mobileMoneyNumber, E_DAHAB_PATTERN, context,
                    "Enter a valid E-Dahab number (62XXXXXXX or 25262XXXXXXX)");
        };
    }

    private boolean validateMobileMoney(Object mobileMoneyNumber, Pattern pattern, ConstraintValidatorContext context, String message) {
        String number = mobileMoneyNumber instanceof String s ? s.trim() : null;
        if (StringUtils.hasText(number) && pattern.matcher(number).matches()) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode(MOBILE_MONEY_NUMBER_PROPERTY)
                .addConstraintViolation();
        return false;
    }

    private boolean validateCard(Object cardPaymentDetails, ConstraintValidatorContext context) {
        if (!(cardPaymentDetails instanceof CardPaymentDetails card)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Card details are required")
                    .addPropertyNode(CARD_PAYMENT_DETAILS_PROPERTY)
                    .addConstraintViolation();
            return false;
        }

        // Field-level presence/pattern checks (@NotBlank, @Pattern on
        // CardPaymentDetails itself, triggered via @Valid) already cover
        // malformed input; this only catches the case where the nested
        // object's own fields are individually well-formed but the last4
        // isn't actually 4 digits, as a defense-in-depth belt-and-braces
        // check consistent with the other two payment methods here.
        if (StringUtils.hasText(card.getCardLast4()) && LAST4_PATTERN.matcher(card.getCardLast4().trim()).matches()) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate("Invalid card details")
                .addPropertyNode(CARD_PAYMENT_DETAILS_PROPERTY)
                .addConstraintViolation();
        return false;
    }
}
