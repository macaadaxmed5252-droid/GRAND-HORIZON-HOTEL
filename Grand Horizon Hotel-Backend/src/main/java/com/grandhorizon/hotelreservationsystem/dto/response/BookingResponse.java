package com.grandhorizon.hotelreservationsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Safe, flat mapping of a {@code Booking} for API responses. Embeds a
 * {@link RoomResponse} summary rather than the JPA entity to avoid
 * serialization cycles and lazy-loading exceptions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Long id;
    private String bookingReference;
    private RoomResponse room;
    private String guestFullName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private long totalNights;
    private BigDecimal totalAmount;
    private String status;
    private String passportId;
    private Integer guestCount;
    /** Null for bookings created before payment method tracking was added. */
    private String paymentMethod;
    /** EVC Plus / E-Dahab subscriber number used at booking time. Null for CREDIT_CARD. */
    private String mobileMoneyNumber;
    /** Card record-keeping fields — last 4 digits only. Null unless paymentMethod is CREDIT_CARD. */
    private String cardholderName;
    private String cardLast4;
    private LocalDateTime checkedInAt;
    private LocalDateTime checkedOutAt;
}
