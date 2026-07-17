package com.grandhorizon.hotelreservationsystem.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Non-sensitive summary of a credit/debit card payment, nested inside
 * {@link BookingRequest} when {@code paymentMethod} is {@code CREDIT_CARD}.
 * <p>
 * Deliberately does NOT carry the full card number, CVC, or expiry date.
 * The frontend validates those fully client-side (length, Luhn checksum,
 * expiry) before submission but only ever transmits the cardholder name
 * and the card's last 4 digits - the same scope reduction a real
 * integration would get from tokenizing through a PCI-compliant processor
 * (Stripe Elements, etc.) instead of routing raw card data through the
 * application's own backend. Since no real gateway is integrated here,
 * this is the closest safe analog: the backend never sees, and therefore
 * can never leak or mishandle, the actual card number or CVC.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardPaymentDetails {

    @NotBlank(message = "Cardholder name is required")
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z\\s]{1,99}$",
            message = "Cardholder name may only contain letters and spaces"
    )
    private String cardholderName;

    @NotBlank(message = "Card last 4 digits are required")
    @Pattern(regexp = "^\\d{4}$", message = "Card last 4 digits must be exactly 4 numbers")
    private String cardLast4;
}
