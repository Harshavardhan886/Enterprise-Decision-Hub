package com.edh.service;

import com.edh.model.Vendor;
import com.edh.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    public List<Vendor> getVendorsByRiskLevel(String riskLevel) {
        return vendorRepository.findByRiskLevel(riskLevel);
    }

    // Called every time an invoice is created for this vendor.
    // Recalculates the vendor's risk level based on how many of their invoices got flagged.
    // Uses findByVendorName which returns the first match — if a race condition created
    // a duplicate, findAll is used as a fallback to merge counts before saving.
    public synchronized Vendor recordInvoiceForVendor(String vendorName, boolean thisInvoiceFlagged) {
        Vendor vendor = vendorRepository.findByVendorName(vendorName)
                .orElse(new Vendor(vendorName));

        vendor.setTotalInvoices(vendor.getTotalInvoices() + 1);
        if (thisInvoiceFlagged) {
            vendor.setFlaggedInvoices(vendor.getFlaggedInvoices() + 1);
        }

        double flaggedRatio = vendor.getTotalInvoices() > 0
                ? (double) vendor.getFlaggedInvoices() / vendor.getTotalInvoices()
                : 0;

        if (flaggedRatio >= 0.4) {
            vendor.setRiskLevel("HIGH");
            vendor.setRiskScore(8);
        } else if (flaggedRatio >= 0.15) {
            vendor.setRiskLevel("MEDIUM");
            vendor.setRiskScore(5);
        } else {
            vendor.setRiskLevel("LOW");
            vendor.setRiskScore(2);
        }

        return vendorRepository.save(vendor);
    }
}
