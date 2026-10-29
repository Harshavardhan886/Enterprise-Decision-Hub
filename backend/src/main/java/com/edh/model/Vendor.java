package com.edh.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vendors")
public class Vendor {
    @Id
    private String id;
    private String vendorName;
    private int totalInvoices;
    private int flaggedInvoices;
    private String riskLevel;
    private int riskScore;

    public Vendor() {}

    public Vendor(String vendorName) {
        this.vendorName = vendorName;
        this.totalInvoices = 0;
        this.flaggedInvoices = 0;
        this.riskLevel = "LOW";
        this.riskScore = 0;
    }

    public Vendor(String vendorName, String riskLevel, int riskScore) {
        this.vendorName = vendorName;
        this.totalInvoices = 0;
        this.flaggedInvoices = 0;
        this.riskLevel = riskLevel;
        this.riskScore = riskScore;
    }

    public String getId() { return id != null ? id : ""; }
    public void setId(String id) { this.id = id; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public int getTotalInvoices() { return totalInvoices; }
    public void setTotalInvoices(int totalInvoices) { this.totalInvoices = totalInvoices; }
    public int getFlaggedInvoices() { return flaggedInvoices; }
    public void setFlaggedInvoices(int flaggedInvoices) { this.flaggedInvoices = flaggedInvoices; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
}
