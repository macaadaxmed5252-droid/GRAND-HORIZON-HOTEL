package com.grandhorizon.hotelreservationsystem.entity;

/**
 * Payment method selected at booking time. No real payment gateway is
 * integrated - this records the guest's choice (and, for the two Somali
 * mobile money rails, the phone number used) for record-keeping only.
 */
public enum PaymentMethod {
    CREDIT_CARD,
    EVC_PLUS,
    E_DAHAB
}
