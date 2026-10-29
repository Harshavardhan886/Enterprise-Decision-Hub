package com.edh.policy;

import java.util.ArrayList;
import java.util.List;

public class PolicyEvaluationResult {
    private List<MatchedPolicy> triggeredPolicies = new ArrayList<>();
    private Integer highestRiskScore = 0;
    private String primaryAction = "ALLOW";
    private List<String> recommendations = new ArrayList<>();

    public static class MatchedPolicy {
        private String name;
        private String action;
        private Integer riskScore;
        private String recommendation;
        private String condition;

        public MatchedPolicy() {}

        public MatchedPolicy(String name, String action, Integer riskScore, String recommendation, String condition) {
            this.name = name;
            this.action = action;
            this.riskScore = riskScore;
            this.recommendation = recommendation;
            this.condition = condition;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public Integer getRiskScore() { return riskScore; }
        public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
    }

    public void addMatchedPolicy(DecisionPolicy policy) {
        triggeredPolicies.add(new MatchedPolicy(
                policy.getName(),
                policy.getAction(),
                policy.getRiskScore(),
                policy.getRecommendation(),
                policy.getCondition()
        ));
        if (policy.getRiskScore() != null && policy.getRiskScore() > highestRiskScore) {
            highestRiskScore = policy.getRiskScore();
        }
        if (policy.getAction() != null) {
            this.primaryAction = policy.getAction();
        }
        if (policy.getRecommendation() != null && !policy.getRecommendation().isBlank()) {
            recommendations.add(policy.getRecommendation());
        }
    }

    public List<MatchedPolicy> getTriggeredPolicies() { return triggeredPolicies; }
    public void setTriggeredPolicies(List<MatchedPolicy> triggeredPolicies) { this.triggeredPolicies = triggeredPolicies; }
    public Integer getHighestRiskScore() { return highestRiskScore; }
    public void setHighestRiskScore(Integer highestRiskScore) { this.highestRiskScore = highestRiskScore; }
    public String getPrimaryAction() { return primaryAction; }
    public void setPrimaryAction(String primaryAction) { this.primaryAction = primaryAction; }
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    public boolean hasTriggered() { return triggeredPolicies != null && !triggeredPolicies.isEmpty(); }
}
