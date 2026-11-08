package com.edh.controller;

import com.edh.model.Invoice;
import com.edh.policy.DecisionPolicy;
import com.edh.policy.PolicyEvaluationResult;
import com.edh.service.AuditLogService;
import com.edh.service.PolicyEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    @Autowired
    private PolicyEngineService policyEngineService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.edh.repository.InvoiceRepository invoiceRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPolicies() {
        List<DecisionPolicy> list = policyEngineService.getPolicies();
        Map<String, Object> resp = new HashMap<>();
        resp.put("policies", list);
        resp.put("count", list.size());
        resp.put("engine", "YAML Decision Engine (SpEL Powered)");
        resp.put("status", "ACTIVE");
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/raw")
    public ResponseEntity<Map<String, String>> getRawYaml() {
        String yaml = policyEngineService.getYamlContent();
        Map<String, String> resp = new HashMap<>();
        resp.put("yaml", yaml);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/raw")
    public ResponseEntity<Map<String, Object>> updateRawYaml(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String yaml = body.get("yaml");
        if (yaml == null || yaml.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "YAML content cannot be empty."));
        }

        try {
            policyEngineService.updateFromYaml(yaml);
            String username = auth != null ? auth.getName() : "SYSTEM";
            auditLogService.log("POLICY_UPDATED", "PolicyEngine", "decision-policies.yaml", username,
                    "YAML policies updated and reloaded.");

            List<DecisionPolicy> updated = policyEngineService.getPolicies();
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "success");
            resp.put("message", "Policies updated and engine reloaded.");
            resp.put("count", updated.size());
            resp.put("policies", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reload")
    public ResponseEntity<Map<String, Object>> reloadPolicies(Authentication auth) {
        policyEngineService.loadPolicies();
        List<DecisionPolicy> list = policyEngineService.getPolicies();

        String username = auth != null ? auth.getName() : "SYSTEM";
        auditLogService.log("POLICY_RELOADED", "PolicyEngine", "decision-policies.yaml", username,
                "Dynamic policy reload executed.");

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "reloaded");
        resp.put("count", list.size());
        resp.put("policies", list);
        return ResponseEntity.ok(resp);
    }

    public static class SimulationRequest {
        public double confidence = 0.50;
        public double predictedSpend = 50000;
        public double budget = 100000;
        public int vendorRiskScore = 3;
        public double expense = 25000;
        public double average = 40000;
        public boolean isDuplicate = false;
        public String department = "Engineering";
    }

    @PostMapping("/evaluate")
    public ResponseEntity<PolicyEvaluationResult> simulateEvaluation(@RequestBody SimulationRequest req) {
        Invoice dummy = new Invoice();
        dummy.setInvoiceNumber("SIM-POLICY-TEST");
        dummy.setAmount(req.expense);
        dummy.setDepartment(req.department);
        dummy.setDuplicateFlag(req.isDuplicate);

        PolicyEvaluationResult result = policyEngineService.evaluate(
                dummy,
                req.confidence,
                req.predictedSpend,
                req.budget,
                req.vendorRiskScore,
                req.average
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/shadow-simulation")
    public ResponseEntity<?> shadowSimulation(@RequestBody Map<String, String> body) {
        String yaml = body.get("yaml");
        List<DecisionPolicy> policyList;
        try {
            if (yaml != null && !yaml.isBlank()) {
                policyList = policyEngineService.parsePoliciesFromYaml(yaml);
            } else {
                policyList = policyEngineService.getPolicies();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid YAML syntax: " + e.getMessage()));
        }

        List<Invoice> invoices = invoiceRepository.findAll();
        int totalEvaluated = invoices.size();
        int impactedCount = 0;
        int flaggedCount = 0;
        int escalatedCount = 0;
        int alertCount = 0;
        double totalHeldAmount = 0.0;
        Map<String, Integer> policyHits = new HashMap<>();
        List<Map<String, Object>> impactedInvoices = new ArrayList<>();

        for (Invoice inv : invoices) {
            PolicyEvaluationResult res = policyEngineService.evaluateWithPolicies(
                    policyList,
                    inv,
                    inv.getMlRiskProbability() != null ? inv.getMlRiskProbability() : 0.0,
                    inv.getAmount() * 1.05,
                    100000.0,
                    inv.getRiskScore(),
                    inv.getDepartmentAverage() != null && inv.getDepartmentAverage() > 0 ? inv.getDepartmentAverage() : 50000.0
            );

            if (!res.getTriggeredPolicies().isEmpty()) {
                impactedCount++;
                String primaryAction = res.getPrimaryAction();
                if ("FLAG_FOR_REVIEW".equalsIgnoreCase(primaryAction)) flaggedCount++;
                if ("ESCALATE".equalsIgnoreCase(primaryAction)) escalatedCount++;
                if ("SEND_ALERT".equalsIgnoreCase(primaryAction)) alertCount++;
                totalHeldAmount += inv.getAmount();

                List<String> matchedNames = new ArrayList<>();
                for (PolicyEvaluationResult.MatchedPolicy mp : res.getTriggeredPolicies()) {
                    matchedNames.add(mp.getName());
                    policyHits.put(mp.getName(), policyHits.getOrDefault(mp.getName(), 0) + 1);
                }

                Map<String, Object> item = new HashMap<>();
                item.put("invoiceNumber", inv.getInvoiceNumber());
                item.put("vendorName", inv.getVendorName());
                item.put("department", inv.getDepartment());
                item.put("amount", inv.getAmount());
                item.put("primaryAction", primaryAction);
                item.put("highestRiskScore", res.getHighestRiskScore());
                item.put("matchedPolicies", matchedNames);
                impactedInvoices.add(item);
            }
        }

        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("totalEvaluated", totalEvaluated);
        resp.put("impactedCount", impactedCount);
        resp.put("flaggedCount", flaggedCount);
        resp.put("escalatedCount", escalatedCount);
        resp.put("alertCount", alertCount);
        resp.put("totalHeldAmount", totalHeldAmount);
        resp.put("policyHits", policyHits);
        resp.put("impactedInvoices", impactedInvoices);
        resp.put("rulesEvaluatedCount", policyList.size());
        resp.put("status", "SUCCESS");
        return ResponseEntity.ok(resp);
    }
}
