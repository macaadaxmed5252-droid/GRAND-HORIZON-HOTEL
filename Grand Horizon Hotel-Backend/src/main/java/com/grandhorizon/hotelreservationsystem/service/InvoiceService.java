package com.grandhorizon.hotelreservationsystem.service;

import com.grandhorizon.hotelreservationsystem.entity.Booking;
import com.grandhorizon.hotelreservationsystem.entity.Invoice;
import org.springframework.core.io.Resource;

public interface InvoiceService {

    Invoice generateInvoice(Booking booking);

    Resource downloadInvoice(Long invoiceId);
}
