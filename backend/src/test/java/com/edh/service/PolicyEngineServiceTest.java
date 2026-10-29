package com.edh.service;

import com.edh.model.Invoice;
import com.edh.policy.DecisionPolicy;
import com.edh.policy.PolicyEvaluationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PolicyEngineServiceTest {

    private PolicyEngineService policyEngineService;

    @BeforeEach
    public void setUp() {
        policyEngineService = new PolicyEngineService();
        policyEngineService.init();
    }

    @Test
    public void testPoliciesAreLoadedFromYaml() {
        List<DecisionPolicy> policies = policyEngineService.getPolicies();
        assertNotNull(policies);
        assertFalse(policies.isEmpty(), "Policies should be loaded from decision-policies.yaml");
        assertTrue(policies.stream().anyMatch(p -> "duplicate_invoice".equals(p.getName())));
        assertTrue(policies.stream().anyMatch(p -> "budget_overspend".equals(p.getName())));
        assertTrue(policies.stream().anyMatch(p -> "vendor_risk".equals(p.getName())));
        assertTrue(policies.stream().anyMatch(p -> "surplus_expense".equals(p.getName())));
    }

    @Test
    public void testDuplicateInvoicePolicyTriggered() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-DUP-01");
        invoice.setAmount(25000);

        // confidence = 0.90 (> 0.85)
        PolicyEvaluationResult result = policyEngineService.evaluate(
                invoice,
                0.90,     // confidence
                50000,    // predicted spend
                100000,   // budget
                3,        // vendor risk
                40000     // dept avg
        );

        assertTrue(result.hasTriggered());
        assertTrue(result.getTriggeredPolicies().stream().anyMatch(p -> "duplicate_invoice".equals(p.getName())));
        assertEquals("FLAG_FOR_REVIEW", result.getPrimaryAction());
        assertEquals(7, result.getHighestRiskScore());
        assertTrue(result.getRecommendations().stream().anyMatch(r -> r.contains("Review both invoices")));
    }

    @Test
    public void testBudgetOverspendPolicyTriggered() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-BDG-01");
        invoice.setAmount(30000);

        // predicted spend = 120,000 (> budget 100,000 * 1.1 = 110,000)
        PolicyEvaluationResult result = policyEngineService.evaluate(
                invoice,
                0.40,      // confidence
                120000,    // predicted spend
                100000,    // budget
                2,         // vendor risk
                35000      // dept avg
        );

        assertTrue(result.hasTriggered());
        assertTrue(result.getTriggeredPolicies().stream().anyMatch(p -> "budget_overspend".equals(p.getName())));
        assertEquals("SEND_ALERT", result.getPrimaryAction());
        assertEquals(8, result.getHighestRiskScore());
        assertTrue(result.getRecommendations().stream().anyMatch(r -> r.contains("Hold non-essential purchases")));
    }

    @Test
    public void testVendorRiskPolicyTriggered() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-VR-01");
        invoice.setAmount(20000);

        // vendor risk score = 8 (> 7)
        PolicyEvaluationResult result = policyEngineService.evaluate(
                invoice,
                0.30,     // confidence
                50000,    // predicted spend
                100000,   // budget
                8,        // vendor risk score
                45000     // dept avg
        );

        assertTrue(result.hasTriggered());
        assertTrue(result.getTriggeredPolicies().stream().anyMatch(p -> "vendor_risk".equals(p.getName())));
        assertEquals("ESCALATE", result.getPrimaryAction());
        assertEquals(6, result.getHighestRiskScore());
        assertTrue(result.getRecommendations().stream().anyMatch(r -> r.contains("Review vendor contract")));
    }

    @Test
    public void testSurplusExpensePolicyTriggered() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-SURPLUS-01");
        invoice.setAmount(80000); // 80,000 > 50,000 * 1.5 = 75,000

        PolicyEvaluationResult result = policyEngineService.evaluate(
                invoice,
                0.25,     // confidence
                60000,    // predicted spend
                150000,   // budget
                3,        // vendor risk
                50000     // dept avg
        );

        assertTrue(result.hasTriggered());
        assertTrue(result.getTriggeredPolicies().stream().anyMatch(p -> "surplus_expense".equals(p.getName())));
        assertEquals("FLAG_FOR_REVIEW", result.getPrimaryAction());
        assertEquals(5, result.getHighestRiskScore());
        assertTrue(result.getRecommendations().stream().anyMatch(r -> r.contains("cost-saving opportunities")));
    }

    @Test
    public void testNormalInvoiceNoPolicyTriggered() {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-NORM-01");
        invoice.setAmount(30000);

        PolicyEvaluationResult result = policyEngineService.evaluate(
                invoice,
                0.20,     // confidence <= 0.85
                60000,    // predicted spend <= budget * 1.1
                100000,   // budget
                3,        // vendor risk <= 7
                50000     // expense 30,000 <= avg * 1.5 (75,000)
        );

        assertFalse(result.hasTriggered());
        assertEquals(0, result.getTriggeredPolicies().size());
        assertEquals("ALLOW", result.getPrimaryAction());
        assertEquals(0, result.getHighestRiskScore());
    }
}
