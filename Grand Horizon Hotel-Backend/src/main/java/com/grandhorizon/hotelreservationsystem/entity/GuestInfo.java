package com.grandhorizon.hotelreservationsystem.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Embeddable value object capturing the guest details associated with a
 * {@link Booking}. Allows a booking to be made under a different guest name
 * than the account holder (e.g. booking on behalf of a family member).
 */
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestInfo {

    @Column(name = "guest_full_name", nullable = false, length = 150)
    private String guestFullName;

    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    @Column(name = "guest_phone", length = 30)
    private String guestPhone;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;
}
