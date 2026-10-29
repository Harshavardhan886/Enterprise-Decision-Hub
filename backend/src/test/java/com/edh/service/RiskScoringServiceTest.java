package com.edh.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RiskScoringServiceTest {

    private RiskScoringService riskScoringService;

    @BeforeEach
    void setUp() {
        riskScoringService = new RiskScoringService();
        ReflectionTestUtils.setField(riskScoringService, "mlServiceUrl", "http://127.0.0.1:1");
    }

    @Test
    void scoreInvoiceCombinesRuleScoreAndFallbackToNoMlResponse() {
        RiskScoringService.RiskAssessmentResult result = riskScoringService.scoreInvoice(true, 5000, 25, "HIGH");

        assertTrue(result.score >= 5);
        assertTrue(result.reasons.stream().anyMatch(reason -> reason.contains("Duplicate")));
        assertTrue(result.recommendations.stream().anyMatch(recommendation -> recommendation.toLowerCase().contains("disbursement") || recommendation.toLowerCase().contains("verify")));
    }

    @Test
    void scoreInvoiceAddsDefaultRecommendationWhenNoSignalsArePresent() {
        RiskScoringService.RiskAssessmentResult result = riskScoringService.scoreInvoice(false, 100, 0, "LOW");

        assertEquals(0, result.score);
        assertTrue(result.recommendations.stream().anyMatch(recommendation -> recommendation.contains("straight-through")));
    }
}
