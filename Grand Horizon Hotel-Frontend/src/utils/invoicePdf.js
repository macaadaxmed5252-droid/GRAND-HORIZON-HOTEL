import { jsPDF } from "jspdf";
import { formatCurrency, formatDate, titleCase } from "./format";

const NAVY = [22, 50, 50];
const GOLD = [180, 83, 9];
const MUTED = [110, 120, 135];

/**
 * Generates a clean, single-page hotel invoice PDF directly from a
 * BookingResponse — no backend invoice record required. This is the
 * primary invoice mechanism for the guest dashboard: the backend's
 * `Invoice` entity/PDF endpoint exists but its id is rarely populated on
 * a booking, so building the document client-side from data the guest
 * already has guarantees the download always works.
 */
export function downloadBookingInvoicePdf(booking, guestEmail) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Grand Horizon Hotel", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(212, 167, 44);
  doc.text("GUEST INVOICE", margin, 62);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(booking.bookingReference || "—", pageWidth - margin, 42, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(230, 230, 235);
  doc.text(formatDate(new Date().toISOString()), pageWidth - margin, 58, { align: "right" });

  let y = 132;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billed To", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  y += 16;
  doc.text(booking.guestFullName || "Guest", margin, y);
  y += 14;
  doc.text(guestEmail || "", margin, y);

  const roomTitle = booking.room?.title || `${titleCase(booking.room?.type)} Room`;
  const rightColX = pageWidth / 2 + 20;
  let ry = 132;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.text("Stay Details", rightColX, ry);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  ry += 16;
  doc.text(`${roomTitle} · Room ${booking.room?.roomNumber ?? "—"}`, rightColX, ry);
  ry += 14;
  doc.text(`${formatDate(booking.checkInDate)}  →  ${formatDate(booking.checkOutDate)}`, rightColX, ry);
  ry += 14;
  doc.text(`${booking.totalNights} night${booking.totalNights === 1 ? "" : "s"}`, rightColX, ry);

  y = Math.max(y, ry) + 36;

  doc.setDrawColor(230, 232, 236);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("DESCRIPTION", margin, y);
  doc.text("AMOUNT", pageWidth - margin, y, { align: "right" });
  y += 10;
  doc.setDrawColor(230, 232, 236);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  const nights = Number(booking.totalNights) || 0;
  const total = Number(booking.totalAmount) || 0;
  const subtotal = total / 1.1;
  const tax = total - subtotal;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...NAVY);
  doc.setFontSize(10.5);
  doc.text(`${roomTitle} — ${nights} night${nights === 1 ? "" : "s"}`, margin, y);
  doc.text(formatCurrency(subtotal), pageWidth - margin, y, { align: "right" });
  y += 22;

  doc.setTextColor(...MUTED);
  doc.text("Tax (10%)", margin, y);
  doc.text(formatCurrency(tax), pageWidth - margin, y, { align: "right" });
  y += 18;

  doc.setDrawColor(230, 232, 236);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text("Grand Total", margin, y);
  doc.setTextColor(...GOLD);
  doc.text(formatCurrency(total), pageWidth - margin, y, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(`Status: ${titleCase(booking.status)}`, margin, y);
  if (booking.paymentMethod) {
    y += 14;
    doc.text(`Payment Method: ${titleCase(booking.paymentMethod)}`, margin, y);
  }

  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "This invoice was generated for your records. No real payment gateway is connected.",
    margin,
    doc.internal.pageSize.getHeight() - 40,
  );

  doc.save(`invoice-${booking.bookingReference || booking.id}.pdf`);
}
