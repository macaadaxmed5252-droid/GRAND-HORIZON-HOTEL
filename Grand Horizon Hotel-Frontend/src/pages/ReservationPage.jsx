import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBooking } from "../api/bookings";
import { resolveRoomImageUrl } from "../api/rooms";
import FormField from "../components/common/FormField";
import Spinner from "../components/common/Spinner";
import ImageWithFallback from "../components/common/ImageWithFallback";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, toIsoDateString, titleCase } from "../utils/format";
import { ApiError } from "../api/client";

// Mirrors InvoiceServiceImpl.TAX_RATE on the backend exactly, so the
// breakdown shown here matches the real invoice generated moments after
// booking — this isn't a decorative estimate, it's the actual rate applied.
const TAX_RATE = 0.1;

const NAME_PATTERN = /^[A-Za-z\s]+$/;
const PHONE_PATTERN = /^\d{10,12}$/;
const PASSPORT_PATTERN = /^[A-Za-z0-9]{4,20}$/;
const EVC_PLUS_PATTERN = /^(61\d{7}|25261\d{7})$/;
const E_DAHAB_PATTERN = /^(62\d{7}|25262\d{7})$/;
const CVC_PATTERN = /^\d{3,4}$/;
const EXPIRY_SHAPE_PATTERN = /^(\d{2})\/(\d{2})$/;

const PAYMENT_OPTIONS = [
  {
    value: "CREDIT_CARD",
    label: "Credit / Debit Card",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20M6 15h4M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
    ),
  },
  {
    value: "EVC_PLUS",
    label: "EVC Plus",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  },
  {
    value: "E_DAHAB",
    label: "E-Dahab",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m-6-3h7a1 1 0 011 1v2a1 1 0 01-1 1h-7a2 2 0 010-4z" />
    ),
  },
];

const MOBILE_MONEY_CONFIG = {
  EVC_PLUS: {
    label: "Enter EVC Plus Number",
    placeholder: "61XXXXXXX",
    pattern: EVC_PLUS_PATTERN,
    hint: "Format: 61XXXXXXX or 25261XXXXXXX",
    error: "Enter a valid EVC Plus number (61XXXXXXX or 25261XXXXXXX).",
  },
  E_DAHAB: {
    label: "Enter E-Dahab Number",
    placeholder: "62XXXXXXX",
    pattern: E_DAHAB_PATTERN,
    hint: "Format: 62XXXXXXX or 25262XXXXXXX",
    error: "Enter a valid E-Dahab number (62XXXXXXX or 25262XXXXXXX).",
  },
};

function todayIso() {
  return toIsoDateString(new Date());
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDateString(date);
}

function digitsOnlyKeyDown(event) {
  if (event.key.length === 1 && !/[0-9]/.test(event.key)) event.preventDefault();
}

/** "4242424242424242" (typed or pasted, any separators) -> "4242 4242 4242 4242", capped at 16 digits. */
function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1229" -> "12/29"; injects the slash as soon as the second digit lands. */
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Standard mod-10 checksum — catches typos/transpositions a length check alone would miss. */
function isValidLuhn(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value) {
  const match = EXPIRY_SHAPE_PATTERN.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) return null;
  const clamped = Math.max(0, Math.min(5, Number(rating)));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-3.5 w-3.5 ${i < Math.round(clamped) ? "fill-gold-500" : "fill-white/25"}`}>
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1 1 5.79L10 14.9l-5.21 2.61 1-5.79-4.21-4.1 5.82-.85z" />
        </svg>
      ))}
    </div>
  );
}

/** Somali-language PIN simulation shown after a valid EVC Plus / E-Dahab number is entered. No PIN value is ever sent to the backend — it's a UI-only confirmation step, since no real payment gateway is integrated. */
function PinConfirmModal({ open, providerLabel, onClose, onConfirm, submitting }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPin("");
      setError("");
    }
  }, [open]);

  function handleConfirm(event) {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Fadlan geli lambar sirta ah oo 4-6 tiro ah (Enter a 4-6 digit PIN).");
      return;
    }
    onConfirm();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Xaqiiji ${providerLabel}`} maxWidth="max-w-sm">
      <form onSubmit={handleConfirm} noValidate className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-navy-950/70">
          Gali Lambarkaaga Sirta ah <span className="text-navy-950/50">(Enter Pin Code)</span> si aad u xaqiijiso dalabka.
        </p>
        <FormField
          id="payment-pin"
          label="PIN Code"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={digitsOnlyKeyDown}
          error={error}
          placeholder="••••"
        />
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-gold">
            {submitting && <Spinner size={16} tone="light" />}
            {submitting ? "Xaqiijinaya…" : "Xaqiiji (Confirm)"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const room = location.state?.room;
  const carriedDates = location.state?.dates;

  const [checkInDate, setCheckInDate] = useState(carriedDates?.checkIn || todayIso());
  const [checkOutDate, setCheckOutDate] = useState(carriedDates?.checkOut || addDaysIso(todayIso(), 1));
  const [guestCount, setGuestCount] = useState(1);
  const [guestFullName, setGuestFullName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [passportId, setPassportId] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  useEffect(() => {
    if (!room) {
      toastError("Select a Room First", "Choose a room from our live inventory to start a reservation.");
      navigate("/rooms", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // Prefill from the account's saved profile as a convenience default, but
  // never overwrite text the guest has already typed (profile arrives
  // asynchronously, sometimes after the guest has started filling the form).
  useEffect(() => {
    if (profile) {
      setGuestFullName((current) => current || profile.name || "");
      setGuestPhone((current) => current || (profile.phone || "").replace(/\D/g, ""));
    }
  }, [profile]);

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const diff = (new Date(`${checkOutDate}T00:00:00`) - new Date(`${checkInDate}T00:00:00`)) / 86_400_000;
    return Number.isFinite(diff) ? Math.max(0, Math.round(diff)) : 0;
  }, [checkInDate, checkOutDate]);

  const subtotal = room ? nights * Number(room.pricePerNight) : 0;
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  const mobileMoneyConfig = paymentMethod ? MOBILE_MONEY_CONFIG[paymentMethod] : null;
  const isCreditCard = paymentMethod === "CREDIT_CARD";

  const cardNumberDigits = cardNumber.replace(/\D/g, "");
  const isCardValid =
    NAME_PATTERN.test(cardholderName.trim()) &&
    cardNumberDigits.length === 16 &&
    isValidLuhn(cardNumberDigits) &&
    isValidExpiry(cardExpiry) &&
    CVC_PATTERN.test(cardCvc);

  const isFormValid =
    nights > 0 &&
    Number(guestCount) >= 1 &&
    NAME_PATTERN.test(guestFullName.trim()) &&
    PHONE_PATTERN.test(guestPhone.trim()) &&
    (passportId.trim() === "" || PASSPORT_PATTERN.test(passportId.trim())) &&
    Boolean(paymentMethod) &&
    (!mobileMoneyConfig || mobileMoneyConfig.pattern.test(mobileMoneyNumber.trim())) &&
    (!isCreditCard || isCardValid);

  if (!room) {
    return null;
  }

  function validateFields() {
    const errors = {};
    if (!NAME_PATTERN.test(guestFullName.trim())) {
      errors.guestFullName = "Full name may only contain letters and spaces.";
    }
    if (!PHONE_PATTERN.test(guestPhone.trim())) {
      errors.guestPhone = "Phone number must be 10-12 digits, numbers only.";
    }
    if (passportId.trim() !== "" && !PASSPORT_PATTERN.test(passportId.trim())) {
      errors.passportId = "Passport/ID must be 4-20 letters and digits only.";
    }
    if (checkOutDate <= checkInDate) {
      errors.checkInDate = "Check-in date must be strictly before the check-out date.";
    }
    if (mobileMoneyConfig && !mobileMoneyConfig.pattern.test(mobileMoneyNumber.trim())) {
      errors.mobileMoneyNumber = mobileMoneyConfig.error;
    }
    if (isCreditCard) {
      if (!NAME_PATTERN.test(cardholderName.trim())) {
        errors.cardholderName = "Cardholder name may only contain letters and spaces.";
      }
      if (cardNumberDigits.length !== 16 || !isValidLuhn(cardNumberDigits)) {
        errors.cardNumber = "Enter a valid 16-digit card number.";
      }
      if (!isValidExpiry(cardExpiry)) {
        errors.cardExpiry = "Invalid Expiration Date.";
      }
      if (!CVC_PATTERN.test(cardCvc)) {
        errors.cardCvc = "CVC must be 3 or 4 digits.";
      }
    }
    return errors;
  }

  async function submitBooking() {
    setSubmitting(true);
    try {
      const booking = await createBooking({
        roomNumber: room.roomNumber,
        checkInDate,
        checkOutDate,
        guestFullName: guestFullName.trim(),
        guestPhone: guestPhone.trim(),
        guestNotes: guestNotes.trim() || undefined,
        passportId: passportId.trim() || undefined,
        guestCount: Number(guestCount),
        paymentMethod,
        mobileMoneyNumber: mobileMoneyConfig ? mobileMoneyNumber.trim() : undefined,
        // Only the cardholder name and last 4 digits ever leave the
        // browser — the full card number, CVC, and expiry are validated
        // client-side and discarded, never transmitted or persisted.
        cardPaymentDetails: isCreditCard
          ? { cardholderName: cardholderName.trim(), cardLast4: cardNumberDigits.slice(-4) }
          : undefined,
      });

      success("Reservation Confirmed", `Booking ${booking.bookingReference} is confirmed. See you soon.`);
      navigate("/dashboard", { replace: true, state: { justBooked: true } });
    } catch (err) {
      setPinModalOpen(false);
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        toastError("Booking Failed", err.message);
      } else {
        setFormError("Something went wrong while creating your reservation.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    if (!paymentMethod) {
      setFormError("Please select a payment method to continue.");
      return;
    }

    if (mobileMoneyConfig) {
      // EVC Plus / E-Dahab: simulate the provider's PIN confirmation step
      // before actually creating the reservation.
      setPinModalOpen(true);
      return;
    }

    submitBooking();
  }

  const imageUrl = resolveRoomImageUrl(room.imageUrl);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <span className="eyebrow">Reservation Details</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy-950">Confirm Your Stay</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* ---------- Left: dynamic form panels ---------- */}
        <div className="flex flex-col gap-6">
          {formError && (
            <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
              {formError}
            </div>
          )}

          <section className="card-surface p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-navy-950">Stay Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <FormField
                id="reserve-check-in"
                label="Check-in Date"
                type="date"
                min={todayIso()}
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                error={fieldErrors.checkInDate}
              />
              <FormField
                id="reserve-check-out"
                label="Check-out Date"
                type="date"
                min={checkInDate}
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                error={fieldErrors.checkOutDate}
              />
              <FormField
                id="reserve-guests"
                label="Guests"
                type="number"
                min="1"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                error={fieldErrors.guestCount}
              />
            </div>
          </section>

          <section className="card-surface p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-navy-950">Guest Information</h2>
            <p className="mt-1 text-sm text-navy-950/50">
              Booked under your account (<span className="font-medium text-navy-950/70">{user?.email}</span>).
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                id="reserve-full-name"
                label="Full Name"
                required
                pattern="^[A-Za-z\s]+$"
                title="Letters and spaces only"
                onKeyDown={(e) => {
                  if (e.key.length === 1 && !/[a-zA-Z\s]/.test(e.key)) e.preventDefault();
                }}
                value={guestFullName}
                onChange={(e) => setGuestFullName(e.target.value)}
                error={fieldErrors.guestFullName}
                hint="Letters and spaces only."
              />
              <FormField
                id="reserve-phone"
                label="Phone Number"
                required
                inputMode="numeric"
                maxLength={12}
                onKeyDown={digitsOnlyKeyDown}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ""))}
                error={fieldErrors.guestPhone}
                hint="Digits only, 10-12 digits."
                placeholder="0611234567"
              />
              <FormField
                id="reserve-passport"
                label="Passport / ID Number (optional)"
                value={passportId}
                onChange={(e) => setPassportId(e.target.value)}
                error={fieldErrors.passportId}
                hint="Letters and digits only, 4-20 characters."
                placeholder="A1234567"
              />
            </div>

            <div className="mt-4">
              <FormField
                id="reserve-notes"
                label="Special Requests (optional)"
                textarea
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                error={fieldErrors.guestNotes}
                placeholder="Late check-in, extra pillows, anniversary — let us know."
              />
            </div>
          </section>

          <section className="card-surface p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-navy-950">Payment Method</h2>
            <p className="mt-1 text-sm text-navy-950/50">No payment gateway is connected — select a method to confirm your reservation.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENT_OPTIONS.map((option) => {
                const active = paymentMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(option.value);
                      setMobileMoneyNumber("");
                      setCardholderName("");
                      setCardNumber("");
                      setCardExpiry("");
                      setCardCvc("");
                      setFieldErrors((current) => ({
                        ...current,
                        mobileMoneyNumber: undefined,
                        cardholderName: undefined,
                        cardNumber: undefined,
                        cardExpiry: undefined,
                        cardCvc: undefined,
                      }));
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center transition-all duration-300 ease-in-out hover:scale-[1.02] ${
                      active ? "border-gold-500 bg-gold-100 shadow-luxury-sm" : "border-navy-950/8 bg-white hover:border-navy-950/20"
                    }`}
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-gold-500 text-white" : "bg-navy-950/6 text-navy-800"}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" strokeWidth={1.7}>
                        {option.icon}
                      </svg>
                    </span>
                    <span className={`text-sm font-semibold ${active ? "text-gold-700" : "text-navy-950/70"}`}>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {mobileMoneyConfig && (
              <div className="mt-4">
                <FormField
                  id="reserve-mobile-money"
                  label={mobileMoneyConfig.label}
                  required
                  inputMode="numeric"
                  maxLength={13}
                  onKeyDown={digitsOnlyKeyDown}
                  value={mobileMoneyNumber}
                  onChange={(e) => setMobileMoneyNumber(e.target.value.replace(/\D/g, ""))}
                  error={fieldErrors.mobileMoneyNumber}
                  hint={mobileMoneyConfig.hint}
                  placeholder={mobileMoneyConfig.placeholder}
                />
              </div>
            )}

            {isCreditCard && (
              <div className="mt-5 flex flex-col gap-4 border-t border-navy-950/8 pt-5">
                <FormField
                  id="reserve-card-name"
                  label="Cardholder Name"
                  required
                  autoComplete="cc-name"
                  onKeyDown={(e) => {
                    if (e.key.length === 1 && !/[a-zA-Z\s]/.test(e.key)) e.preventDefault();
                  }}
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  error={fieldErrors.cardholderName}
                  hint="Name exactly as printed on the card."
                  placeholder="Ahmed Warsame"
                />

                <FormField
                  id="reserve-card-number"
                  label="Card Number"
                  required
                  inputMode="numeric"
                  autoComplete="cc-number"
                  maxLength={19}
                  onKeyDown={digitsOnlyKeyDown}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  error={fieldErrors.cardNumber}
                  placeholder="4242 4242 4242 4242"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4.5 w-4.5" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 10h20M6 15h4M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" />
                    </svg>
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="reserve-card-expiry"
                    label="Expiry Date"
                    required
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    onKeyDown={(e) => {
                      if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    error={fieldErrors.cardExpiry}
                    hint="MM/YY"
                    placeholder="MM/YY"
                  />
                  <FormField
                    id="reserve-card-cvc"
                    label="CVC / CVV"
                    type="password"
                    required
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    onKeyDown={digitsOnlyKeyDown}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                    error={fieldErrors.cardCvc}
                    hint="3 or 4 digits, back of card."
                    placeholder="•••"
                  />
                </div>

                <p className="flex items-center gap-1.5 text-xs text-navy-950/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5 shrink-0" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Card details are validated on this device and never leave it beyond a masked reference.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ---------- Right: sticky booking summary ---------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface overflow-hidden">
            <div className="relative h-48 w-full">
              <ImageWithFallback src={imageUrl} alt={room.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{titleCase(room.type)} · Room {room.roomNumber}</p>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold text-white">{room.title}</h2>
                  <RatingStars rating={room.rating} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Check-in</dt>
                  <dd className="font-medium text-navy-950">{checkInDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Check-out</dt>
                  <dd className="font-medium text-navy-950">{checkOutDate}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Duration</dt>
                  <dd className="font-medium text-navy-950">{nights} night{nights === 1 ? "" : "s"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Guests</dt>
                  <dd className="font-medium text-navy-950">{guestCount}</dd>
                </div>
              </dl>

              <div className="space-y-2 border-t border-navy-950/8 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Subtotal</dt>
                  <dd className="text-navy-950">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy-950/50">Tax (10%)</dt>
                  <dd className="text-navy-950">{formatCurrency(tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-navy-950/8 pt-2.5 text-base">
                  <dt className="font-semibold text-navy-950">Grand Total</dt>
                  <dd className="font-display font-bold text-gold-600">{formatCurrency(grandTotal)}</dd>
                </div>
              </div>

              <button type="submit" disabled={submitting || !isFormValid} className="btn-gold mt-1 justify-center !py-3.5">
                {submitting && <Spinner size={16} tone="light" />}
                {submitting ? "Confirming…" : `Confirm & Pay — ${formatCurrency(grandTotal)}`}
              </button>

              <p className="text-center text-xs leading-relaxed text-navy-950/40">
                No charge is actually processed — this reserves the room and records the amount above.
              </p>
            </div>
          </div>
        </aside>
      </form>

      <PinConfirmModal
        open={pinModalOpen}
        providerLabel={mobileMoneyConfig ? PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label : ""}
        onClose={() => setPinModalOpen(false)}
        onConfirm={submitBooking}
        submitting={submitting}
      />
    </div>
  );
}
