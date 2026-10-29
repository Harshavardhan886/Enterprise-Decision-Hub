package com.edh.repository;

import com.edh.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    List<Invoice> findByInvoiceNumberAndVendorName(String invoiceNumber, String vendorName);
    List<Invoice> findByDepartment(String department);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByDuplicateFlagTrue();
    List<Invoice> findByVendorName(String vendorName);

    Page<Invoice> findByVendorNameContainingIgnoreCaseOrInvoiceNumberContainingIgnoreCase(
            String vendorName, String invoiceNumber, Pageable pageable);
    Page<Invoice> findByDepartment(String department, Pageable pageable);
}
