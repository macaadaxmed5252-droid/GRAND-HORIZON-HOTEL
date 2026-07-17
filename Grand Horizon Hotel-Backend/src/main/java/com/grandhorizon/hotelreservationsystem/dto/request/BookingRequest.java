package com.grandhorizon.hotelreservationsystem.dto.request;

import com.grandhorizon.hotelreservationsystem.entity.PaymentMethod;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidCheckInCheckOut;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidPaymentDetails;
import com.grandhorizon.hotelreservationsystem.validation.annotation.ValidRoomNumber;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ValidCheckInCheckOut
@ValidPaymentDetails
public class BookingRequest {

    @NotBlank(message = "Room number is required")
    @ValidRoomNumber
    private String roomNumber;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Check-out date is required")
    private LocalDate checkOutDate;

    @NotBlank(message = "Full name is required")
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z\\s]{1,99}$",
            message = "Full name may only contain letters and spaces"
    )
    private String guestFullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^\\d{10,12}$",
            message = "Phone number must be 10-12 digits, numbers only"
    )
    private String guestPhone;

    private String guestNotes;

    /** Optional - passport or national ID number, recorded for front-desk verification. */
    @Pattern(
            regexp = "^[A-Za-z0-9]{4,20}$",
            message = "Passport/ID must be 4-20 letters and digits only"
    )
    private String passportId;

    @NotNull(message = "Guest count is required")
    @Min(value = 1, message = "At least 1 guest is required")
    private Integer guestCount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    /** Required for EVC_PLUS / E_DAHAB (see {@link ValidPaymentDetails}); unused for CREDIT_CARD. */
    @Size(max = 20, message = "Mobile money number is too long")
    private String mobileMoneyNumber;

    /** Required for CREDIT_CARD (see {@link ValidPaymentDetails}); unused for EVC_PLUS / E_DAHAB. */
    @Valid
    private CardPaymentDetails cardPaymentDetails;
}
