package com.edh.service;

import com.edh.model.Budget;
import com.edh.model.Invoice;
import com.edh.model.Vendor;
import com.edh.policy.PolicyEvaluationResult;
import com.edh.repository.BudgetRepository;
import com.edh.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private VendorService vendorService;

    @Autowired
    private RiskScoringService riskScoringService;

    @Autowired
    private PolicyEngineService policyEngineService;

    @Autowired
    private LlmAdvisoryService llmAdvisoryService;

    @Autowired
    private AlertService alertService;

    @Autowired
    private AuditLogService auditLogService;

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Page<Invoice> getInvoicesPaginated(String search, String department, int page, int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "invoiceDate"));

        if (department != null && !department.isBlank() && !"ALL".equalsIgnoreCase(department)) {
            return invoiceRepository.findByDepartment(department, pageable);
        }
        if (search != null && !search.isBlank()) {
            return invoiceRepository.findByVendorNameContainingIgnoreCaseOrInvoiceNumberContainingIgnoreCase(search, search, pageable);
        }
        return invoiceRepository.findAll(pageable);
    }

    public Optional<Invoice> getInvoiceById(String id) {
        return invoiceRepository.findById(id);
    }

    public List<Invoice> getInvoicesByDepartment(String department) {
        return invoiceRepository.findByDepartment(department);
    }

    public List<Invoice> getFlaggedDuplicates() {
        return invoiceRepository.findByDuplicateFlagTrue();
    }

    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public Invoice createInvoice(Invoice invoice) {
        // 1. Detect duplicate
        boolean isDuplicate = !invoiceRepository
                .findByInvoiceNumberAndVendorName(invoice.getInvoiceNumber(), invoice.getVendorName())
                .isEmpty();

        invoice.setDuplicateFlag(isDuplicate);
        invoice.setStatus(isDuplicate ? "FLAGGED" : "PENDING");

        // 2. Vendor record & risk calculation
        Vendor vendor = vendorService.recordInvoiceForVendor(invoice.getVendorName(), isDuplicate);
        int vendorRiskNumeric = 2;
        if ("HIGH".equalsIgnoreCase(vendor.getRiskLevel())) {
            vendorRiskNumeric = 8;
        } else if ("MEDIUM".equalsIgnoreCase(vendor.getRiskLevel())) {
            vendorRiskNumeric = 5;
        }

        // 3. Department budget stats
        List<Budget> budgets = budgetRepository.findByDepartment(invoice.getDepartment());
        double allocatedBudget = 100000.0;
        double currentSpend = 0.0;
        double budgetOverspendPct = 0.0;

        if (!budgets.isEmpty()) {
            Budget b = budgets.get(0);
            allocatedBudget = b.getAllocatedAmount();
            currentSpend = b.getSpentAmount();
            if (b.isOverspendFlag()) {
                budgetOverspendPct = b.getOverspendPercentage();
            }
        }
        double predictedSpend = currentSpend + invoice.getAmount();

        // 4. Department & Vendor average invoice calculations for Surplus Flagging
        List<Invoice> deptInvoices = invoiceRepository.findByDepartment(invoice.getDepartment());
        double deptAvg = deptInvoices.isEmpty()
                ? 50000.0
                : deptInvoices.stream().mapToDouble(Invoice::getAmount).average().orElse(50000.0);

        List<Invoice> vendorInvoices = invoiceRepository.findByVendorName(invoice.getVendorName());
        double vendorAvg = vendorInvoices.isEmpty()
                ? deptAvg
                : vendorInvoices.stream().mapToDouble(Invoice::getAmount).average().orElse(deptAvg);

        boolean isDeptSurplus = deptAvg > 0 && invoice.getAmount() > (1.5 * deptAvg);
        boolean isVendorSurplus = vendorAvg > 0 && invoice.getAmount() > (2.0 * vendorAvg);

        invoice.setDepartmentAverage(deptAvg);
        invoice.setVendorAverage(vendorAvg);
        invoice.setSurplusExpenseFlag(isDeptSurplus);
        invoice.setVendorSurplusFlag(isVendorSurplus);

        // 5. Multi-Model Risk Scoring (RF + XGBoost + Isolation Forest)
        RiskScoringService.RiskAssessmentResult risk = riskScoringService.scoreInvoice(
                isDuplicate, invoice.getAmount(), budgetOverspendPct, vendor.getRiskLevel());

        // 6. YAML Policy Engine Evaluation
        PolicyEvaluationResult policyResult = policyEngineService.evaluate(
                invoice,
                risk.mlProbability,
                predictedSpend,
                allocatedBudget,
                vendorRiskNumeric,
                deptAvg
        );

        // 7. Reconcile Risk & Policy Outputs
        int finalRiskScore = Math.max(risk.score, policyResult.getHighestRiskScore());
        if (isDeptSurplus || isVendorSurplus) {
            finalRiskScore = Math.max(finalRiskScore, 5); // Surplus minimum policy risk score
        }
        invoice.setRiskScore(finalRiskScore);
        invoice.setSentryLevel(Invoice.computeSentryLevel(finalRiskScore));

        invoice.setMlRiskProbability(risk.mlProbability);
        invoice.setPrimaryModelName(risk.primaryModelName);
        invoice.setSecondaryModelRiskProbability(risk.secondaryMlProbability);
        invoice.setSecondaryModelRiskScore(risk.secondaryScore);
        invoice.setSecondaryModelName(risk.secondaryModelName);
        invoice.setModelAgreement(risk.modelAgreement);

        invoice.setAnomalyFlag(risk.isAnomaly);
        invoice.setAnomalyScore(risk.anomalyScore);
        invoice.setRiskReasons(risk.reasons);

        // Merge recommendations from ML and Policy Engine
        List<String> combinedRecs = new ArrayList<>(risk.recommendations);
        for (String rec : policyResult.getRecommendations()) {
            if (!combinedRecs.contains(rec)) {
                combinedRecs.add(rec);
            }
        }
        if (isDeptSurplus || isVendorSurplus) {
            String surplusReason = isDeptSurplus && isVendorSurplus
                    ? String.format("Invoice amount (₹%,.0f) exceeds 1.5x department average (₹%,.0f) and 2.0x vendor average (₹%,.0f)", invoice.getAmount(), deptAvg, vendorAvg)
                    : (isDeptSurplus
                        ? String.format("Invoice amount (₹%,.0f) exceeds 1.5x department average (₹%,.0f)", invoice.getAmount(), deptAvg)
                        : String.format("Invoice amount (₹%,.0f) exceeds 2.0x vendor average (₹%,.0f)", invoice.getAmount(), vendorAvg));
            if (!invoice.getRiskReasons().contains(surplusReason)) {
                invoice.getRiskReasons().add(surplusReason);
            }
            String surplusRec = "Review expense reports and identify cost-saving opportunities or negotiate volume tier";
            if (!combinedRecs.contains(surplusRec)) {
                combinedRecs.add(surplusRec);
            }
        }
        invoice.setRiskRecommendations(combinedRecs);
        invoice.setMlExplanation(risk.summary);
        invoice.setModelVersion(risk.modelVersion);

        // Attach Policy Engine matches
        List<String> matchedNames = policyResult.getTriggeredPolicies().stream()
                .map(PolicyEvaluationResult.MatchedPolicy::getName)
                .collect(Collectors.toList());
        invoice.setTriggeredPolicies(matchedNames);
        invoice.setPolicyAction(policyResult.getPrimaryAction());
        invoice.setPolicyRiskScore(policyResult.getHighestRiskScore());

        // Optional Layer: LLM Advisory Service (Never overrides deterministic scores)
        if (llmAdvisoryService != null) {
            try {
                String llmSummary = llmAdvisoryService.generateInvoiceExplanation(
                        invoice,
                        !budgets.isEmpty() ? budgets.get(0) : null,
                        vendor,
                        policyResult
                );
                invoice.setLlmExplanation(llmSummary);
                if (invoice.getMlExplanation() == null || invoice.getMlExplanation().isBlank()) {
                    invoice.setMlExplanation(llmSummary);
                }
            } catch (Exception ex) {
                // Fail silently, never halt processing
            }
        }

        // Apply Policy & Surplus Actions
        if ("FLAG_FOR_REVIEW".equalsIgnoreCase(policyResult.getPrimaryAction()) ||
            "ESCALATE".equalsIgnoreCase(policyResult.getPrimaryAction()) ||
            isDuplicate || isDeptSurplus || isVendorSurplus) {
            invoice.setStatus("FLAGGED");
        }

        Invoice saved = invoiceRepository.save(invoice);

        // 8. Generate Alerts & Audit Logs
        auditLogService.log("INVOICE_CREATED", "Invoice", saved.getId(), "SYSTEM",
                "Amount ₹" + saved.getAmount() + ", risk score " + finalRiskScore + "/10 (Sentry: "
                        + saved.getSentryLevel() + ", ML: " + Math.round(risk.mlProbability * 100)
                        + "%, Policies: " + (matchedNames.isEmpty() ? "NONE" : String.join(",", matchedNames)) + ")");

        if (isDeptSurplus || isVendorSurplus) {
            String surplusMsg = isDeptSurplus && isVendorSurplus
                    ? "Surplus expense detected: exceeds 1.5x department average and 2.0x vendor average"
                    : (isDeptSurplus ? "Surplus expense detected: exceeds 1.5x department average" : "Surplus expense detected: exceeds 2.0x vendor average");
            alertService.createAlert("SURPLUS_EXPENSE", saved.getId(), saved.getDepartment(),
                    finalRiskScore, surplusMsg + " on invoice " + saved.getInvoiceNumber(),
                    "Review expense reports and identify cost-saving opportunities");
        }

        if ("ESCALATE".equalsIgnoreCase(policyResult.getPrimaryAction())) {
            alertService.createAlert("POLICY_ESCALATION", saved.getId(), saved.getDepartment(),
                    finalRiskScore, "Policy ESCALATE triggered on invoice " + saved.getInvoiceNumber() + " [" + String.join(", ", matchedNames) + "]",
                    String.join("; ", policyResult.getRecommendations()));
        } else if ("SEND_ALERT".equalsIgnoreCase(policyResult.getPrimaryAction())) {
            alertService.createAlert("POLICY_VIOLATION", saved.getId(), saved.getDepartment(),
                    finalRiskScore, "Policy alert triggered on invoice " + saved.getInvoiceNumber() + " [" + String.join(", ", matchedNames) + "]",
                    String.join("; ", policyResult.getRecommendations()));
        } else if (risk.isAnomaly) {
            alertService.createAlert("UNUSUAL_SPENDING", saved.getId(), saved.getDepartment(),
                    finalRiskScore, "Structural anomaly detected by Isolation Forest in invoice " + saved.getInvoiceNumber(),
                    String.join("; ", combinedRecs));
        } else if (finalRiskScore >= 6) {
            alertService.createAlert(isDuplicate ? "DUPLICATE_INVOICE" : "HIGH_RISK_INVOICE",
                    saved.getId(), saved.getDepartment(),
                    finalRiskScore, "High risk invoice detected: " + saved.getInvoiceNumber(),
                    String.join("; ", combinedRecs));
        }

        return saved;
    }

    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public Invoice updateInvoice(String id, Invoice updated) {
        updated.setId(id);
        Invoice saved = invoiceRepository.save(updated);
        auditLogService.log("INVOICE_UPDATED", "Invoice", id, "USER", "Invoice status set to " + updated.getStatus());
        return saved;
    }

    @CacheEvict(value = "dashboard-stats", allEntries = true)
    public void deleteInvoice(String id) {
        invoiceRepository.deleteById(id);
        auditLogService.log("INVOICE_DELETED", "Invoice", id, "USER", "Invoice deleted");
    }
}
