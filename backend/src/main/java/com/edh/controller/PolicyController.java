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
}
