package com.grandhorizon.hotelreservationsystem.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a reservation of a {@link Room} by a {@link User} for a
 * specific date range.
 */
@Entity
@Table(
        name = "bookings",
        indexes = {
                @Index(name = "idx_bookings_room_id", columnList = "room_id"),
                @Index(name = "idx_bookings_user_id", columnList = "user_id"),
                @Index(name = "idx_bookings_status", columnList = "status")
        }
)
@Data
@EqualsAndHashCode(of = "id")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Embedded
    private GuestInfo guestInfo;

    @Column(name = "passport_id", length = 50)
    private String passportId;

    // Deliberately nullable at the DB level (even though @NotNull on
    // BookingRequest makes it required for every new booking) so that
    // Hibernate's ddl-auto=update can add this column to a table that
    // already has rows without failing - Postgres rejects adding a NOT
    // NULL column with no default to a non-empty table.
    @Column(name = "guest_count")
    @Builder.Default
    private Integer guestCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    /** EVC Plus / E-Dahab subscriber number used at booking time. Null for CREDIT_CARD. */
    @Column(name = "mobile_money_number", length = 20)
    private String mobileMoneyNumber;

    /**
     * Card payment record-keeping fields - name and last 4 digits only.
     * The full card number and CVC are validated client-side and never
     * transmitted to or stored by this backend (see
     * {@link com.grandhorizon.hotelreservationsystem.dto.request.CardPaymentDetails}).
     * Null unless paymentMethod is CREDIT_CARD.
     */
    @Column(name = "cardholder_name", length = 100)
    private String cardholderName;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "checked_out_at")
    private LocalDateTime checkedOutAt;

    @JsonIgnore
    @OneToOne(mappedBy = "booking", fetch = FetchType.LAZY)
    private Invoice invoice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
