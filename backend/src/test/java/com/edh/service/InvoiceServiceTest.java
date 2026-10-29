package com.edh.service;

import com.edh.model.Invoice;
import com.edh.model.Vendor;
import com.edh.policy.PolicyEvaluationResult;
import com.edh.repository.BudgetRepository;
import com.edh.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private VendorService vendorService;

    @Mock
    private RiskScoringService riskScoringService;

    @Mock
    private AlertService alertService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private PolicyEngineService policyEngineService;

    @Mock
    private LlmAdvisoryService llmAdvisoryService;

    @InjectMocks
    private InvoiceService invoiceService;

    private Invoice sampleInvoice;
    private Vendor sampleVendor;

    @BeforeEach
    void setUp() {
        sampleInvoice = new Invoice("INV-001", "Apex Logistics", "Finance", 50000.0, LocalDate.now());
        sampleInvoice.setId("inv-123");

        sampleVendor = new Vendor("Apex Logistics", "LOW", 0);
    }

    @Test
    void createInvoice_UniqueInvoice_ScoredAndSavedSuccessfully() {
        when(invoiceRepository.findByInvoiceNumberAndVendorName("INV-001", "Apex Logistics"))
                .thenReturn(Collections.emptyList());
        when(vendorService.recordInvoiceForVendor("Apex Logistics", false))
                .thenReturn(sampleVendor);
        when(budgetRepository.findByDepartment("Finance"))
                .thenReturn(Collections.emptyList());

        RiskScoringService.RiskAssessmentResult riskResult = new RiskScoringService.RiskAssessmentResult();
        riskResult.score = 2;
        riskResult.mlProbability = 0.18;
        riskResult.isAnomaly = false;
        riskResult.summary = "Low risk transaction";
        riskResult.recommendations = List.of("Standard straight-through processing");

        when(riskScoringService.scoreInvoice(eq(false), eq(50000.0), eq(0.0), eq("LOW")))
                .thenReturn(riskResult);
        when(policyEngineService.evaluate(any(Invoice.class), anyDouble(), anyDouble(), anyDouble(), anyInt(), anyDouble()))
                .thenReturn(new PolicyEvaluationResult());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice result = invoiceService.createInvoice(sampleInvoice);

        assertNotNull(result);
        assertEquals(2, result.getRiskScore());
        assertFalse(result.isDuplicateFlag());
        assertEquals("PENDING", result.getStatus());
        assertEquals(0.18, result.getMlRiskProbability());
        verify(invoiceRepository).save(sampleInvoice);
        verify(auditLogService).log(eq("INVOICE_CREATED"), eq("Invoice"), any(), eq("SYSTEM"), anyString());
        verify(alertService, never()).createAlert(anyString(), anyString(), anyString(), anyInt(), anyString(), anyString());
    }

    @Test
    void createInvoice_DuplicateInvoice_TriggersFlagAndHighRiskAlert() {
        when(invoiceRepository.findByInvoiceNumberAndVendorName("INV-001", "Apex Logistics"))
                .thenReturn(List.of(new Invoice("INV-001", "Apex Logistics", "Finance", 50000.0, LocalDate.now())));
        when(vendorService.recordInvoiceForVendor("Apex Logistics", true))
                .thenReturn(new Vendor("Apex Logistics", "HIGH", 8));
        when(budgetRepository.findByDepartment("Finance"))
                .thenReturn(Collections.emptyList());

        RiskScoringService.RiskAssessmentResult riskResult = new RiskScoringService.RiskAssessmentResult();
        riskResult.score = 8;
        riskResult.mlProbability = 0.99;
        riskResult.isAnomaly = false;
        riskResult.reasons = List.of("Duplicate invoice and vendor combination detected");
        riskResult.recommendations = List.of("Place disbursement hold");

        when(riskScoringService.scoreInvoice(eq(true), eq(50000.0), eq(0.0), eq("HIGH")))
                .thenReturn(riskResult);
        PolicyEvaluationResult dupPolicyResult = new PolicyEvaluationResult();
        dupPolicyResult.setHighestRiskScore(8);
        when(policyEngineService.evaluate(any(Invoice.class), anyDouble(), anyDouble(), anyDouble(), anyInt(), anyDouble()))
                .thenReturn(dupPolicyResult);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Invoice result = invoiceService.createInvoice(sampleInvoice);

        assertNotNull(result);
        assertTrue(result.isDuplicateFlag());
        assertEquals("FLAGGED", result.getStatus());
        assertEquals(8, result.getRiskScore());
        verify(alertService).createAlert(eq("DUPLICATE_INVOICE"), any(), eq("Finance"), eq(8), anyString(), anyString());
    }

    @Test
    void getInvoiceById_ReturnsInvoiceWhenFound() {
        when(invoiceRepository.findById("inv-123")).thenReturn(Optional.of(sampleInvoice));

        Optional<Invoice> found = invoiceService.getInvoiceById("inv-123");
        assertTrue(found.isPresent());
        assertEquals("INV-001", found.get().getInvoiceNumber());
    }
}
