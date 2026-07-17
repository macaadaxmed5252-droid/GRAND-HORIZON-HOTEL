package com.grandhorizon.hotelreservationsystem.service.impl;

import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.Invoice;
import com.grandhorizon.hotelreservationsystem.exception.ResourceNotFoundException;
import com.grandhorizon.hotelreservationsystem.repository.InvoiceRepository;
import com.grandhorizon.hotelreservationsystem.service.InvoiceService;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Generates financial receipts for confirmed bookings. Renders an actual
 * PDF invoice via OpenPDF, persists it to the configured storage
 * directory, and records the invoice metadata for later retrieval.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.10");
    private static final DateTimeFormatter DISPLAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final InvoiceRepository invoiceRepository;

    @Value("${application.invoice.storage-path:invoices}")
    private String invoiceStorageDirectory;

    @Override
    @Transactional
    public Invoice generateInvoice(Booking booking) {
        BigDecimal taxAmount = booking.getTotalAmount().multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = booking.getTotalAmount().add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        String invoiceNumber = generateInvoiceNumber(booking);

        byte[] pdfBytes = renderInvoicePdf(booking, invoiceNumber, taxAmount, grandTotal);
        String storagePath = persistInvoicePdf(invoiceNumber, pdfBytes);

        Invoice invoice = Invoice.builder()
                .booking(booking)
                .invoiceNumber(invoiceNumber)
                .issuedAt(LocalDateTime.now())
                .taxAmount(taxAmount)
                .grandTotal(grandTotal)
                .pdfStoragePath(storagePath)
                .build();

        log.info("Generated invoice {} for booking {}", invoiceNumber, booking.getId());
        return invoiceRepository.save(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));

        try {
            byte[] pdfBytes = Files.readAllBytes(Paths.get(invoice.getPdfStoragePath()));
            return new ByteArrayResource(pdfBytes);
        } catch (IOException ex) {
            throw new UncheckedIOException(
                    "Unable to read invoice file at " + invoice.getPdfStoragePath(), ex);
        }
    }

    private String generateInvoiceNumber(Booking booking) {
        return String.format("INV-%d-%06d", LocalDateTime.now().getYear(), booking.getId());
    }

    private String persistInvoicePdf(String invoiceNumber, byte[] pdfBytes) {
        try {
            Path directory = Paths.get(invoiceStorageDirectory);
            Files.createDirectories(directory);
            Path filePath = directory.resolve(invoiceNumber + ".pdf");
            Files.write(filePath, pdfBytes);
            return filePath.toString();
        } catch (IOException ex) {
            throw new UncheckedIOException("Unable to persist invoice PDF for " + invoiceNumber, ex);
        }
    }

    private byte[] renderInvoicePdf(Booking booking, String invoiceNumber, BigDecimal taxAmount, BigDecimal grandTotal) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            document.add(new Paragraph("Grand Horizon Hotel", titleFont));
            document.add(new Paragraph("Invoice", headingFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Invoice Number: " + invoiceNumber, normalFont));
            document.add(new Paragraph("Issued At: " + LocalDateTime.now().format(DISPLAY_DATE_FORMATTER), normalFont));
            document.add(new Paragraph("Booking Reference: GH-BK-" + String.format("%06d", booking.getId()), normalFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Guest Name: " + booking.getGuestInfo().getGuestFullName(), normalFont));
            document.add(new Paragraph("Room Number: " + booking.getRoom().getRoomNumber(), normalFont));
            document.add(new Paragraph("Room Type: " + booking.getRoom().getType(), normalFont));
            document.add(new Paragraph("Check-in: " + booking.getCheckInDate().format(DISPLAY_DATE_FORMATTER), normalFont));
            document.add(new Paragraph("Check-out: " + booking.getCheckOutDate().format(DISPLAY_DATE_FORMATTER), normalFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Subtotal: $" + booking.getTotalAmount(), normalFont));
            document.add(new Paragraph("Tax (10%): $" + taxAmount, normalFont));
            document.add(new Paragraph("Grand Total: $" + grandTotal, headingFont));

            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate invoice PDF for booking " + booking.getId(), ex);
        }
    }
}
