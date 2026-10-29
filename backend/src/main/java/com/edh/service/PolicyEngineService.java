package com.edh.service;

import com.edh.model.Invoice;
import com.edh.policy.DecisionPolicy;
import com.edh.policy.PolicyEvaluationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class PolicyEngineService {

    private static final Logger log = LoggerFactory.getLogger(PolicyEngineService.class);

    private final List<DecisionPolicy> policies = Collections.synchronizedList(new ArrayList<>());
    private final ExpressionParser parser = new SpelExpressionParser();
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
    private Path activePolicyFilePath = null;

    @PostConstruct
    public void init() {
        loadPolicies();
    }

    private Path resolvePolicyFilePath() {
        // 1. Try relative to working directory (backend/) -> ../policies/decision-policies.yaml
        Path path1 = Paths.get("..", "policies", "decision-policies.yaml");
        if (Files.exists(path1)) {
            return path1.toAbsolutePath().normalize();
        }

        // 2. Try direct policies/decision-policies.yaml (root of repo or docker)
        Path path2 = Paths.get("policies", "decision-policies.yaml");
        if (Files.exists(path2)) {
            return path2.toAbsolutePath().normalize();
        }

        // 3. Try backend resource directory
        Path path3 = Paths.get("src", "main", "resources", "policies", "decision-policies.yaml");
        if (Files.exists(path3)) {
            return path3.toAbsolutePath().normalize();
        }

        return path1.toAbsolutePath().normalize();
    }

    @CacheEvict(value = "policies", allEntries = true)
    public synchronized void loadPolicies() {
        policies.clear();
        JsonNode rootNode = null;
        try {
            Path filePath = resolvePolicyFilePath();
            if (Files.exists(filePath)) {
                log.info("[PolicyEngine] Loading decision policies from file: {}", filePath);
                activePolicyFilePath = filePath;
                rootNode = yamlMapper.readTree(filePath.toFile());
            } else {
                // Fallback to classpath resource
                log.info("[PolicyEngine] Loading decision policies from classpath: policies/decision-policies.yaml");
                ClassPathResource resource = new ClassPathResource("policies/decision-policies.yaml");
                if (resource.exists()) {
                    try (InputStream is = resource.getInputStream()) {
                        rootNode = yamlMapper.readTree(is);
                    }
                }
            }

            if (rootNode != null && rootNode.has("policies")) {
                for (JsonNode node : rootNode.get("policies")) {
                    DecisionPolicy policy = new DecisionPolicy();
                    policy.setName(node.has("name") ? node.get("name").asText() : "");
                    policy.setCondition(node.has("condition") ? node.get("condition").asText() : "");
                    policy.setAction(node.has("action") ? node.get("action").asText() : "FLAG_FOR_REVIEW");
                    policy.setRiskScore(node.has("risk_score") ? node.get("risk_score").asInt() : 5);
                    policy.setRecommendation(node.has("recommendation") ? node.get("recommendation").asText() : "");
                    policies.add(policy);
                }
                log.info("[PolicyEngine] Successfully loaded {} decision policies.", policies.size());
            } else {
                log.warn("[PolicyEngine] No 'policies' array found in decision-policies.yaml.");
            }
        } catch (Exception e) {
            log.error("[PolicyEngine] Failed to load decision-policies.yaml: {}", e.getMessage(), e);
        }
    }

    @Cacheable(value = "policies", key = "'all'")
    public List<DecisionPolicy> getPolicies() {
        return new ArrayList<>(policies);
    }

    public String getYamlContent() {
        try {
            Path filePath = resolvePolicyFilePath();
            if (Files.exists(filePath)) {
                return Files.readString(filePath, StandardCharsets.UTF_8);
            }
            ClassPathResource resource = new ClassPathResource("policies/decision-policies.yaml");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            log.error("[PolicyEngine] Error reading YAML content: {}", e.getMessage());
        }
        return "policies: []";
    }

    @CacheEvict(value = "policies", allEntries = true)
    public synchronized boolean updateFromYaml(String yamlContent) {
        try {
            // Validate YAML syntax first
            JsonNode rootNode = yamlMapper.readTree(yamlContent);
            if (rootNode == null || !rootNode.has("policies")) {
                throw new IllegalArgumentException("YAML must contain a top-level 'policies' list.");
            }

            Path target = activePolicyFilePath != null ? activePolicyFilePath : resolvePolicyFilePath();
            if (target.getParent() != null) {
                Files.createDirectories(target.getParent());
            }
            Files.writeString(target, yamlContent, StandardCharsets.UTF_8);

            // Also update backend resource if different
            Path resPath = Paths.get("src", "main", "resources", "policies", "decision-policies.yaml");
            if (Files.exists(resPath.getParent()) && !target.equals(resPath.toAbsolutePath().normalize())) {
                Files.writeString(resPath, yamlContent, StandardCharsets.UTF_8);
            }

            loadPolicies();
            return true;
        } catch (Exception e) {
            log.error("[PolicyEngine] Failed to update policies from YAML: {}", e.getMessage());
            throw new RuntimeException("Invalid YAML policy structure: " + e.getMessage(), e);
        }
    }

    public PolicyEvaluationResult evaluate(
            Invoice invoice,
            double confidence,
            double predictedSpend,
            double budget,
            int vendorRiskScore,
            double deptAverage) {

        PolicyEvaluationResult result = new PolicyEvaluationResult();
        StandardEvaluationContext context = new StandardEvaluationContext();

        // Bind variables for SpEL expressions matching YAML conditions:
        // duplicate_invoice:  confidence > 0.85
        // budget_overspend:   predicted_spend > budget * 1.1
        // vendor_risk:        risk_score > 7
        // surplus_expense:    expense > average * 1.5
        context.setVariable("confidence", Double.valueOf(confidence));
        context.setVariable("predicted_spend", Double.valueOf(predictedSpend));
        context.setVariable("budget", Double.valueOf(budget > 0 ? budget : 100000.0));
        context.setVariable("risk_score", Double.valueOf(vendorRiskScore));
        context.setVariable("expense", Double.valueOf(invoice != null ? invoice.getAmount() : 0.0));
        context.setVariable("average", Double.valueOf(deptAverage > 0 ? deptAverage : 50000.0));
        context.setVariable("is_duplicate", Boolean.valueOf(invoice != null && invoice.isDuplicateFlag()));
        context.setVariable("department", invoice != null && invoice.getDepartment() != null ? invoice.getDepartment() : "General");

        for (DecisionPolicy policy : policies) {
            String condition = policy.getCondition();
            if (condition == null || condition.isBlank()) {
                continue;
            }

            try {
                // SpEL parser handles standard syntax: confidence > 0.85, predicted_spend > budget * 1.1
                // Replace bare variable identifiers with #var syntax required by SpEL
                String spelExpr = condition
                        .replaceAll("\\bconfidence\\b", "#confidence")
                        .replaceAll("\\bpredicted_spend\\b", "#predicted_spend")
                        .replaceAll("\\bbudget\\b", "#budget")
                        .replaceAll("\\brisk_score\\b", "#risk_score")
                        .replaceAll("\\bexpense\\b", "#expense")
                        .replaceAll("\\baverage\\b", "#average")
                        .replaceAll("\\bis_duplicate\\b", "#is_duplicate")
                        .replaceAll("\\bdepartment\\b", "#department");

                Expression expression = parser.parseExpression(spelExpr);
                Boolean matches = expression.getValue(context, Boolean.class);

                if (Boolean.TRUE.equals(matches)) {
                    log.info("[PolicyEngine] Matched [{}] for invoice {}",
                            policy.getName(), invoice != null ? invoice.getInvoiceNumber() : "Simulated");
                    result.addMatchedPolicy(policy);
                }
            } catch (Exception e) {
                log.warn("[PolicyEngine] Error evaluating policy [{}]: condition '{}', error: {}",
                        policy.getName(), condition, e.getMessage());
            }
        }

        return result;
    }
}
