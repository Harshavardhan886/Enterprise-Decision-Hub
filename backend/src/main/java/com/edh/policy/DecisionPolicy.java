package com.edh.policy;

public class DecisionPolicy {
    private String name;
    private String condition;
    private String action;
    private Integer riskScore;
    private String recommendation;

    public DecisionPolicy() {}

    public DecisionPolicy(String name, String condition, String action, Integer riskScore, String recommendation) {
        this.name = name;
        this.condition = condition;
        this.action = action;
        this.riskScore = riskScore;
        this.recommendation = recommendation;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}
