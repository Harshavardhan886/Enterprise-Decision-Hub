package com.edh.service;

import com.edh.model.Vendor;
import com.edh.repository.VendorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.AdditionalAnswers;

import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendorServiceTest {

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private VendorService vendorService;

    @Test
    void recordInvoiceForVendorMarksHighRiskWhenThresholdReached() {
        Vendor existing = new Vendor("Acme");
        existing.setTotalInvoices(2);
        existing.setFlaggedInvoices(1);
        when(vendorRepository.findByVendorName("Acme")).thenReturn(Optional.of(existing));
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());

        Vendor result = Objects.requireNonNull(vendorService.recordInvoiceForVendor("Acme", true));

        assertEquals(3, result.getTotalInvoices());
        assertEquals(2, result.getFlaggedInvoices());
        assertEquals("HIGH", result.getRiskLevel());
        assertEquals(8, result.getRiskScore());
        verify(vendorRepository).save(any(Vendor.class));
    }

    @Test
    void recordInvoiceForVendorCreatesLowRiskVendorWhenNoHistoryExists() {
        when(vendorRepository.findByVendorName("NewCo")).thenReturn(Optional.empty());
        when(vendorRepository.save(any(Vendor.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());

        Vendor result = Objects.requireNonNull(vendorService.recordInvoiceForVendor("NewCo", false));

        assertEquals("LOW", result.getRiskLevel());
        assertEquals(2, result.getRiskScore());
        assertEquals(1, result.getTotalInvoices());
        assertEquals(0, result.getFlaggedInvoices());
    }
}
