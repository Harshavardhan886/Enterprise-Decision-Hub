package com.edh.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "invoices")
public class Invoice {
    @Id
    private String id;

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;

    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    @NotBlank(message = "Department is required")
    private String department;

    @Positive(message = "Amount must be greater than zero")
    private double amount;

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;

    private String status = "PENDING";
    private boolean duplicateFlag = false;
    private int riskScore = 0;

    // Multi-Model ML & Explainable AI Fields
    private Double mlRiskProbability = 0.0;
    private String primaryModelName = "Random Forest Classifier";
    private Double secondaryModelRiskProbability = 0.0;
    private Integer secondaryModelRiskScore = 0;
    private String secondaryModelName = "XGBoost Classifier";
    private String modelAgreement = "CONCORDANT";

    private boolean anomalyFlag = false;
    private Double anomalyScore = 0.0;
    private List<String> riskReasons = new ArrayList<>();
    private List<String> riskRecommendations = new ArrayList<>();
    private String mlExplanation = "";
    private String modelVersion = "v3.0-MultiModel";

    // Sentry Level: GREEN (0-3), YELLOW (4-6), ORANGE (7-8), RED (9-10)
    private String sentryLevel = "GREEN";

    // Surplus Expense Flagging Fields
    private boolean surplusExpenseFlag = false; // expense > 1.5 * department average
    private boolean vendorSurplusFlag = false;  // expense > 2.0 * vendor average
    private Double departmentAverage = 0.0;
    private Double vendorAverage = 0.0;

    // LLM Advisory Service Field
    private String llmExplanation = "";

    // YAML Policy Engine Fields
    private List<String> triggeredPolicies = new ArrayList<>();
    private String policyAction = "ALLOW";
    private Integer policyRiskScore = 0;

    // Explainable AI: Local Waterfall Risk Attribution Breakdown
    private List<java.util.Map<String, Object>> riskWaterfall = new ArrayList<>();

    public static String computeSentryLevel(int score) {
        if (score >= 9) return "RED";
        if (score >= 7) return "ORANGE";
        if (score >= 4) return "YELLOW";
        return "GREEN";
    }

    public Invoice() {}

    public Invoice(String invoiceNumber, String vendorName, String department, double amount, LocalDate invoiceDate) {
        this.invoiceNumber = invoiceNumber;
        this.vendorName = vendorName;
        this.department = department;
        this.amount = amount;
        this.invoiceDate = invoiceDate;
        this.status = "PENDING";
        this.duplicateFlag = false;
        this.riskScore = 0;
    }

    public String getId() { return id != null ? id : ""; }
    public void setId(String id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isDuplicateFlag() { return duplicateFlag; }
    public void setDuplicateFlag(boolean duplicateFlag) { this.duplicateFlag = duplicateFlag; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
        this.sentryLevel = computeSentryLevel(riskScore);
    }

    public String getSentryLevel() {
        return sentryLevel != null ? sentryLevel : computeSentryLevel(riskScore);
    }
    public void setSentryLevel(String sentryLevel) { this.sentryLevel = sentryLevel; }

    public boolean isSurplusExpenseFlag() { return surplusExpenseFlag; }
    public void setSurplusExpenseFlag(boolean surplusExpenseFlag) { this.surplusExpenseFlag = surplusExpenseFlag; }

    public boolean isVendorSurplusFlag() { return vendorSurplusFlag; }
    public void setVendorSurplusFlag(boolean vendorSurplusFlag) { this.vendorSurplusFlag = vendorSurplusFlag; }

    public Double getDepartmentAverage() { return departmentAverage != null ? departmentAverage : 0.0; }
    public void setDepartmentAverage(Double departmentAverage) { this.departmentAverage = departmentAverage; }

    public Double getVendorAverage() { return vendorAverage != null ? vendorAverage : 0.0; }
    public void setVendorAverage(Double vendorAverage) { this.vendorAverage = vendorAverage; }

    public String getLlmExplanation() { return llmExplanation != null ? llmExplanation : ""; }
    public void setLlmExplanation(String llmExplanation) { this.llmExplanation = llmExplanation; }

    public Double getMlRiskProbability() { return mlRiskProbability; }
    public void setMlRiskProbability(Double mlRiskProbability) { this.mlRiskProbability = mlRiskProbability; }
    public String getPrimaryModelName() { return primaryModelName; }
    public void setPrimaryModelName(String primaryModelName) { this.primaryModelName = primaryModelName; }
    public Double getSecondaryModelRiskProbability() { return secondaryModelRiskProbability; }
    public void setSecondaryModelRiskProbability(Double secondaryModelRiskProbability) { this.secondaryModelRiskProbability = secondaryModelRiskProbability; }
    public Integer getSecondaryModelRiskScore() { return secondaryModelRiskScore; }
    public void setSecondaryModelRiskScore(Integer secondaryModelRiskScore) { this.secondaryModelRiskScore = secondaryModelRiskScore; }
    public String getSecondaryModelName() { return secondaryModelName; }
    public void setSecondaryModelName(String secondaryModelName) { this.secondaryModelName = secondaryModelName; }
    public String getModelAgreement() { return modelAgreement; }
    public void setModelAgreement(String modelAgreement) { this.modelAgreement = modelAgreement; }

    public boolean isAnomalyFlag() { return anomalyFlag; }
    public void setAnomalyFlag(boolean anomalyFlag) { this.anomalyFlag = anomalyFlag; }
    public Double getAnomalyScore() { return anomalyScore; }
    public void setAnomalyScore(Double anomalyScore) { this.anomalyScore = anomalyScore; }
    public List<String> getRiskReasons() { return riskReasons != null ? riskReasons : new ArrayList<>(); }
    public void setRiskReasons(List<String> riskReasons) { this.riskReasons = riskReasons; }
    public List<String> getRiskRecommendations() { return riskRecommendations != null ? riskRecommendations : new ArrayList<>(); }
    public void setRiskRecommendations(List<String> riskRecommendations) { this.riskRecommendations = riskRecommendations; }
    public String getMlExplanation() { return mlExplanation; }
    public void setMlExplanation(String mlExplanation) { this.mlExplanation = mlExplanation; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public List<String> getTriggeredPolicies() { return triggeredPolicies != null ? triggeredPolicies : new ArrayList<>(); }
    public void setTriggeredPolicies(List<String> triggeredPolicies) { this.triggeredPolicies = triggeredPolicies; }
    public String getPolicyAction() { return policyAction; }
    public void setPolicyAction(String policyAction) { this.policyAction = policyAction; }
    public Integer getPolicyRiskScore() { return policyRiskScore != null ? policyRiskScore : 0; }
    public void setPolicyRiskScore(Integer policyRiskScore) { this.policyRiskScore = policyRiskScore; }

    public List<java.util.Map<String, Object>> getRiskWaterfall() { return riskWaterfall != null ? riskWaterfall : new ArrayList<>(); }
    public void setRiskWaterfall(List<java.util.Map<String, Object>> riskWaterfall) { this.riskWaterfall = riskWaterfall; }
}
