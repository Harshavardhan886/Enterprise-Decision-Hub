package com.edh.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RiskScoringService {

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    @Value("${ml.service.api-key:edh_internal_ml_key_8f92b7c4a1e9}")
    private String mlApiKey;

    private final RestTemplate restTemplate;

    public RiskScoringService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2500);
        factory.setReadTimeout(3500);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    public void normalizeMlUrl() {
        if (mlServiceUrl != null) {
            mlServiceUrl = mlServiceUrl.trim();
            if (!mlServiceUrl.startsWith("http://") && !mlServiceUrl.startsWith("https://")) {
                mlServiceUrl = "http://" + mlServiceUrl;
            }
            if (mlServiceUrl.endsWith("/")) {
                mlServiceUrl = mlServiceUrl.substring(0, mlServiceUrl.length() - 1);
            }
        }
        System.out.println(">>> [RiskScoringService] Normalized ML Service URL: " + mlServiceUrl);
    }

    public static class RiskAssessmentResult {
        public int score;
        public double mlProbability;
        public double secondaryMlProbability;
        public int secondaryScore;
        public String modelAgreement = "CONCORDANT";
        public String primaryModelName = "Random Forest Classifier";
        public String secondaryModelName = "XGBoost Classifier";
        public boolean isAnomaly;
        public double anomalyScore;
        public String sentryLevel = "GREEN"; // GREEN (0-3), YELLOW (4-6), ORANGE (7-8), RED (9-10)
        public List<String> reasons = new ArrayList<>();
        public List<String> recommendations = new ArrayList<>();
        public String summary = "";
        public String modelVersion = "v3.0-MultiModel";
        public Map<String, Object> featureImportances = new HashMap<>();
        public Map<String, Object> multiModelDetails = new HashMap<>();
        public List<Map<String, Object>> waterfall = new ArrayList<>();
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (mlApiKey != null && !mlApiKey.isBlank()) {
            headers.set("X-ML-API-KEY", mlApiKey);
        }
        return headers;
    }

    @SuppressWarnings("unchecked")
    public RiskAssessmentResult scoreInvoice(boolean isDuplicate, double amount, double budgetOverspendPercentage,
                                             String vendorRiskLevel) {
        RiskAssessmentResult result = new RiskAssessmentResult();

        // 1. Call ML Microservice: Multi-Model Predict (RF, XGBoost, Isolation Forest)
        Map<?, ?> predictRes = callMlPredictDetails(amount, isDuplicate, budgetOverspendPercentage, vendorRiskLevel);

        double mlProb = 0.0;
        double secondaryProb = 0.0;
        int secondaryScore = 0;
        boolean isAnomaly = false;
        double anomalyScore = 0.0;
        String agreement = "CONCORDANT";

        if (predictRes != null) {
            if (predictRes.get("risk_probability") instanceof Number) {
                mlProb = ((Number) predictRes.get("risk_probability")).doubleValue();
            }
            if (predictRes.get("model_agreement") != null) {
                agreement = predictRes.get("model_agreement").toString();
            }
            if (predictRes.get("model_version") != null) {
                result.modelVersion = predictRes.get("model_version").toString();
            }
            if (Boolean.TRUE.equals(predictRes.get("anomaly_flag"))) {
                isAnomaly = true;
            }
            if (predictRes.get("anomaly_score") instanceof Number) {
                anomalyScore = ((Number) predictRes.get("anomaly_score")).doubleValue();
            }

            // Extract individual models (Random Forest, XGBoost, Isolation Forest)
            Object modelsObj = predictRes.get("models");
            if (modelsObj instanceof Map) {
                Map<?, ?> modelsMap = (Map<?, ?>) modelsObj;
                result.multiModelDetails.putAll((Map<String, Object>) modelsMap);

                // XGBoost Secondary details
                Object xgbObj = modelsMap.get("xgboost");
                if (xgbObj instanceof Map) {
                    Map<?, ?> xgbMap = (Map<?, ?>) xgbObj;
                    if (xgbMap.get("risk_probability") instanceof Number) {
                        secondaryProb = ((Number) xgbMap.get("risk_probability")).doubleValue() / 100.0;
                    }
                    if (xgbMap.get("risk_score") instanceof Number) {
                        secondaryScore = ((Number) xgbMap.get("risk_score")).intValue();
                    }
                }

                // Random Forest Primary details
                Object rfObj = modelsMap.get("random_forest");
                if (rfObj instanceof Map) {
                    Map<?, ?> rfMap = (Map<?, ?>) rfObj;
                    if (rfMap.get("feature_importance") instanceof Map) {
                        result.featureImportances.putAll((Map<String, Object>) rfMap.get("feature_importance"));
                    }
                }
            }

            // Extract local waterfall feature attribution
            Object waterfallObj = predictRes.get("waterfall");
            if (waterfallObj instanceof List) {
                for (Object item : (List<?>) waterfallObj) {
                    if (item instanceof Map) {
                        result.waterfall.add((Map<String, Object>) item);
                    }
                }
            }
        }

        // Anomaly fallback check if predict endpoint didn't provide it
        if (!isAnomaly) {
            Map<?, ?> anomalyRes = callMlAnomaly(amount, isDuplicate, budgetOverspendPercentage, vendorRiskLevel);
            if (anomalyRes != null) {
                isAnomaly = Boolean.TRUE.equals(anomalyRes.get("is_anomaly"));
                if (anomalyRes.get("anomaly_score") instanceof Number) {
                    anomalyScore = ((Number) anomalyRes.get("anomaly_score")).doubleValue();
                }
            }
        }

        result.mlProbability = mlProb;
        result.secondaryMlProbability = secondaryProb;
        result.secondaryScore = secondaryScore;
        result.modelAgreement = agreement;
        result.isAnomaly = isAnomaly;
        result.anomalyScore = anomalyScore;

        // 2. Score Computation (Rules as Guardrails, ML as Primary Intelligence)
        int calculatedScore;

        if (isDuplicate) {
            // Hard Guardrail: Duplicate submissions are critical anomalies
            calculatedScore = 8;
            result.reasons.add("Duplicate invoice and vendor combination detected");
            result.recommendations.add("Place disbursement hold and verify duplicate invoice submission with supplier");
        } else if (budgetOverspendPercentage >= 20.0) {
            // Hard Guardrail: Extreme budget breach
            int mlScore = (int) Math.round(mlProb * 10);
            calculatedScore = Math.max(7, mlScore);
            result.reasons.add("Severe department budget overspend (" + Math.round(budgetOverspendPercentage) + "%)");
            result.recommendations.add("Escalate to department head for formal budget review and variance sign-off");
        } else {
            // Primary Scoring: Calibrated Multi-Model Prediction (RF + XGBoost ensemble)
            calculatedScore = (int) Math.round(mlProb * 10);

            if (isAnomaly) {
                // Isolation Forest structural penalty
                calculatedScore = Math.min(10, calculatedScore + 2);
                result.reasons.add("Structural outlier detected by Isolation Forest (unusual expenditure pattern)");
                result.recommendations.add("Conduct manual verification of items and unit prices against purchase contract");
            }
        }

        result.score = Math.max(0, Math.min(10, calculatedScore));
        result.sentryLevel = computeSentryLevel(result.score);

        // 3. Call ML Explainability Engine for Deep Factors & Recommendations
        Map<?, ?> explainRes = callMlExplain(amount, isDuplicate, budgetOverspendPercentage, vendorRiskLevel, result.score);
        if (explainRes != null) {
            if (explainRes.get("summary") != null) {
                result.summary = explainRes.get("summary").toString();
            }
            if (explainRes.get("model_version") != null) {
                result.modelVersion = explainRes.get("model_version").toString();
            }
            if (explainRes.get("factors") instanceof List) {
                List<?> factors = (List<?>) explainRes.get("factors");
                for (Object f : factors) {
                    if (f != null && !result.reasons.contains(f.toString())) {
                        result.reasons.add(f.toString());
                    }
                }
            }
            if (explainRes.get("recommendations") instanceof List) {
                List<?> recs = (List<?>) explainRes.get("recommendations");
                for (Object r : recs) {
                    if (r != null && !result.recommendations.contains(r.toString())) {
                        result.recommendations.add(r.toString());
                    }
                }
            }
        }

        if (result.reasons.isEmpty()) {
            result.reasons.add("Invoice parameters conform to standard baseline transaction distribution");
        }
        if (result.recommendations.isEmpty()) {
            result.recommendations.add("Standard straight-through processing approved");
        }
        if (result.summary.isEmpty()) {
            result.summary = "Risk score " + result.score + "/10 with " + Math.round(mlProb * 100) + "% ML risk probability (" + agreement + " consensus).";
        }

        return result;
    }

    private Map<?, ?> callMlPredictDetails(double amount, boolean isDuplicate, double overspendPercentage, String vendorRiskLevel) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amount);
            payload.put("is_duplicate", isDuplicate ? 1 : 0);
            payload.put("overspend_percentage", overspendPercentage);
            payload.put("vendor_risk_level", vendorRiskLevel != null ? vendorRiskLevel : "LOW");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, createAuthHeaders());
            return restTemplate.postForObject(mlServiceUrl + "/predict", entity, Map.class);
        } catch (RestClientException ex) {
            System.err.println("[RiskScoringService] ML predict fallback: " + ex.getMessage());
            return null;
        }
    }

    private Map<?, ?> callMlAnomaly(double amount, boolean isDuplicate, double overspendPercentage, String vendorRiskLevel) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amount);
            payload.put("is_duplicate", isDuplicate ? 1 : 0);
            payload.put("overspend_percentage", overspendPercentage);
            payload.put("vendor_risk_level", vendorRiskLevel != null ? vendorRiskLevel : "LOW");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, createAuthHeaders());
            return restTemplate.postForObject(mlServiceUrl + "/anomaly", entity, Map.class);
        } catch (RestClientException ex) {
            return null;
        }
    }

    private Map<?, ?> callMlExplain(double amount, boolean isDuplicate, double overspendPercentage, String vendorRiskLevel, int riskScore) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amount);
            payload.put("is_duplicate", isDuplicate ? 1 : 0);
            payload.put("overspend_percentage", overspendPercentage);
            payload.put("vendor_risk_level", vendorRiskLevel != null ? vendorRiskLevel : "LOW");
            payload.put("risk_score", riskScore);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, createAuthHeaders());
            return restTemplate.postForObject(mlServiceUrl + "/explain", entity, Map.class);
        } catch (RestClientException ex) {
            return null;
        }
    }

    public static String computeSentryLevel(int score) {
        if (score >= 9) return "RED";
        if (score >= 7) return "ORANGE";
        if (score >= 4) return "YELLOW";
        return "GREEN";
    }
}
