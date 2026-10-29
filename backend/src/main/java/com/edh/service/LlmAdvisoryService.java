package com.edh.service;

import com.edh.model.Budget;
import com.edh.model.Invoice;
import com.edh.model.Vendor;
import com.edh.policy.PolicyEvaluationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * 4-Layer Architecture: Optional LLM Advisory Service Layer
 * Generates natural language human-readable explanations for invoice risk decisions & alert executive summaries.
 * 
 * Invariants:
 * 1. NEVER overrides deterministic policy decisions or risk scores.
 * 2. Falls back gracefully to expert rule-based narrative templates if the external LLM API is unavailable.
 */
@Service
public class LlmAdvisoryService {

    private static final Logger log = LoggerFactory.getLogger(LlmAdvisoryService.class);

    @Value("${llm.enabled:true}")
    private boolean enabled;

    @Value("${llm.provider:gemini}")
    private String provider; // "gemini" or "openai"

    @Value("${llm.gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${llm.openai.api-key:${OPENAI_API_KEY:}}")
    private String openaiApiKey;

    private final RestTemplate restTemplate;

    public LlmAdvisoryService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Generates a natural language explanation for an invoice risk assessment.
     */
    public String generateInvoiceExplanation(
            Invoice invoice,
            Budget budget,
            Vendor vendor,
            PolicyEvaluationResult policyResult) {

        if (!enabled) {
            return generateDeterministicFallback(invoice, budget, vendor, policyResult);
        }

        // Try calling external LLM if API key is present
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String liveExplanation = callGeminiApi(invoice, budget, vendor, policyResult);
                if (liveExplanation != null && !liveExplanation.isBlank()) {
                    return liveExplanation;
                }
            } catch (Exception e) {
                log.warn("[LlmAdvisory] Gemini API call failed: {}. Falling back gracefully.", e.getMessage());
            }
        } else if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            try {
                String liveExplanation = callOpenAiApi(invoice, budget, vendor, policyResult);
                if (liveExplanation != null && !liveExplanation.isBlank()) {
                    return liveExplanation;
                }
            } catch (Exception e) {
                log.warn("[LlmAdvisory] OpenAI API call failed: {}. Falling back gracefully.", e.getMessage());
            }
        }

        // Deterministic expert narrative fallback
        return generateDeterministicFallback(invoice, budget, vendor, policyResult);
    }

    /**
     * Generates an executive summary for an alert.
     */
    public String generateAlertSummary(String alertType, String department, int severity, String message, String recommendation) {
        String sentryLevel = Invoice.computeSentryLevel(severity);
        return String.format(
                "Executive Briefing: Sentry Level %s (%d/10) flagged in %s department for %s. %s. Action Required: %s.",
                sentryLevel,
                severity,
                department != null ? department : "General",
                alertType != null ? alertType.replace("_", " ") : "Anomaly",
                message != null ? message : "Variance threshold exceeded",
                recommendation != null ? recommendation : "Verify details with finance operations"
        );
    }

    /**
     * High-fidelity deterministic narrative generator mirroring executive enterprise advisories.
     */
    public String generateDeterministicFallback(
            Invoice invoice,
            Budget budget,
            Vendor vendor,
            PolicyEvaluationResult policyResult) {

        int score = invoice != null ? invoice.getRiskScore() : 0;
        String sentry = invoice != null && invoice.getSentryLevel() != null
                ? invoice.getSentryLevel()
                : Invoice.computeSentryLevel(score);

        String dept = invoice != null && invoice.getDepartment() != null ? invoice.getDepartment() : "Corporate";
        String vendorName = invoice != null && invoice.getVendorName() != null ? invoice.getVendorName() : "Vendor";
        double amount = invoice != null ? invoice.getAmount() : 0.0;

        // 1. Duplicate Invoice Pattern
        if (invoice != null && invoice.isDuplicateFlag()) {
            return String.format(
                    "We detected a high risk (%d/10, Sentry Level %s) of duplicate billing for invoice %s from vendor %s. " +
                    "An identical invoice identifier was already registered in the ledger. " +
                    "We recommend placing an immediate disbursement hold and verifying invoice authenticity with %s.",
                    score, sentry, invoice.getInvoiceNumber(), vendorName, vendorName
            );
        }

        // 2. Budget Overspend Pattern
        if (budget != null && (budget.isOverspendFlag() || (budget.getAllocatedAmount() > 0 && (budget.getSpentAmount() + amount) > budget.getAllocatedAmount()))) {
            double overspendPct = budget.getOverspendPercentage() > 0
                    ? budget.getOverspendPercentage()
                    : ((amount / Math.max(1, budget.getAllocatedAmount())) * 100);
            return String.format(
                    "We detected a high risk (%d/10, Sentry Level %s) of budget overspend in the %s department. " +
                    "%s expenses have increased and are projected to exceed the allocated budget by %.1f%%. " +
                    "We recommend holding non-essential purchases and scheduling a review with the finance team.",
                    score, sentry, dept, dept, Math.max(10.0, overspendPct)
            );
        }

        // 3. Surplus Expense Pattern
        if (invoice != null && invoice.isSurplusExpenseFlag()) {
            double avg = invoice.getDepartmentAverage() > 0 ? invoice.getDepartmentAverage() : 50000.0;
            double ratio = avg > 0 ? (amount / avg) : 1.5;
            return String.format(
                    "We detected a surplus expenditure anomaly in the %s department. " +
                    "Invoice amount (₹%,.0f) is %.1fx higher than the departmental historical average of ₹%,.0f. " +
                    "We recommend reviewing expense reports and identifying cost-saving opportunities.",
                    dept, amount, ratio, avg
            );
        }

        // 4. Vendor Risk Pattern
        if (vendor != null && "HIGH".equalsIgnoreCase(vendor.getRiskLevel())) {
            return String.format(
                    "We detected elevated vendor governance risk (%d/10, Sentry Level %s) associated with %s. " +
                    "The supplier profile indicates heightened delivery or compliance risk. " +
                    "We recommend reviewing the vendor contract and considering alternate suppliers.",
                    score, sentry, vendorName
            );
        }

        // 5. Unsupervised Anomaly
        if (invoice != null && invoice.isAnomalyFlag()) {
            return String.format(
                    "Isolation Forest detected a multidimensional outlier anomaly (%d/10, Sentry Level %s) for %s in %s. " +
                    "The expenditure profile deviates significantly from peer transaction clusters. " +
                    "We recommend line-item verification before payment processing.",
                    score, sentry, vendorName, dept
            );
        }

        // 6. Low Risk Clean Invoice
        return String.format(
                "Invoice %s for ₹%,.0f from %s in %s has been evaluated as low risk (%d/10, Sentry Level %s). " +
                "All expenditure amounts, vendor checks, and budget allocations are within authorized governance limits. " +
                "Recommended for straight-through approval.",
                invoice != null ? invoice.getInvoiceNumber() : "",
                amount,
                vendorName,
                dept,
                score,
                sentry
        );
    }

    private String callGeminiApi(Invoice invoice, Budget budget, Vendor vendor, PolicyEvaluationResult policyResult) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
        String prompt = buildPrompt(invoice, budget, vendor, policyResult);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> body = Map.of("contents", List.of(content));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        Map<?, ?> response = restTemplate.postForObject(url, entity, Map.class);
        if (response != null && response.containsKey("candidates")) {
            List<?> candidates = (List<?>) response.get("candidates");
            if (!candidates.isEmpty() && candidates.get(0) instanceof Map) {
                Map<?, ?> firstCand = (Map<?, ?>) candidates.get(0);
                Map<?, ?> candContent = (Map<?, ?>) firstCand.get("content");
                if (candContent != null && candContent.containsKey("parts")) {
                    List<?> parts = (List<?>) candContent.get("parts");
                    if (!parts.isEmpty() && parts.get(0) instanceof Map) {
                        return (String) ((Map<?, ?>) parts.get(0)).get("text");
                    }
                }
            }
        }
        return null;
    }

    private String callOpenAiApi(Invoice invoice, Budget budget, Vendor vendor, PolicyEvaluationResult policyResult) {
        String url = "https://api.openai.com/v1/chat/completions";
        String prompt = buildPrompt(invoice, budget, vendor, policyResult);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(message),
                "max_tokens", 150,
                "temperature", 0.3
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        Map<?, ?> response = restTemplate.postForObject(url, entity, Map.class);
        if (response != null && response.containsKey("choices")) {
            List<?> choices = (List<?>) response.get("choices");
            if (!choices.isEmpty() && choices.get(0) instanceof Map) {
                Map<?, ?> firstChoice = (Map<?, ?>) choices.get(0);
                Map<?, ?> msg = (Map<?, ?>) firstChoice.get("message");
                if (msg != null && msg.containsKey("content")) {
                    return (String) msg.get("content");
                }
            }
        }
        return null;
    }

    private String buildPrompt(Invoice invoice, Budget budget, Vendor vendor, PolicyEvaluationResult policyResult) {
        return String.format(
                "You are the Enterprise Decision Hub Advisory Service. Provide a concise 2-3 sentence executive explanation " +
                "for why this invoice was evaluated with the given risk score. Do NOT override the risk score or policy actions.\n" +
                "Invoice Number: %s\n" +
                "Vendor: %s\n" +
                "Department: %s\n" +
                "Amount: ₹%.2f\n" +
                "Risk Score: %d/10 (Sentry Level: %s)\n" +
                "Duplicate Flag: %b\n" +
                "Anomaly Flag: %b\n" +
                "Policy Action: %s\n" +
                "Triggered Policies: %s\n" +
                "Provide an authoritative, clear executive summary with recommendations.",
                invoice.getInvoiceNumber(),
                invoice.getVendorName(),
                invoice.getDepartment(),
                invoice.getAmount(),
                invoice.getRiskScore(),
                invoice.getSentryLevel(),
                invoice.isDuplicateFlag(),
                invoice.isAnomalyFlag(),
                invoice.getPolicyAction(),
                invoice.getTriggeredPolicies()
        );
    }
}
