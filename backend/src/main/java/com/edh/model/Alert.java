package com.edh.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;
    private String type;
    private String relatedEntityId;
    private String department;
    private int riskScore;
    private String sentryLevel;
    private String executiveSummary;
    private String message;
    private String recommendation;
    private String status;
    private LocalDateTime createdAt;

    public Alert() {}

    public Alert(String type, String relatedEntityId, String department, int riskScore,
                 String message, String recommendation) {
        this.type = type;
        this.relatedEntityId = relatedEntityId;
        this.department = department;
        this.riskScore = riskScore;
        this.message = message;
        this.recommendation = recommendation;
        this.status = "SENT";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id != null ? id : ""; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(String relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
    public String getSentryLevel() { return sentryLevel; }
    public void setSentryLevel(String sentryLevel) { this.sentryLevel = sentryLevel; }
    public String getExecutiveSummary() { return executiveSummary; }
    public void setExecutiveSummary(String executiveSummary) { this.executiveSummary = executiveSummary; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
