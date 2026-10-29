package com.edh.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "budgets")
public class Budget {
    @Id
    private String id;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Month is required")
    private String month;

    @Min(value = 2020, message = "Year must be valid")
    private int year;

    @Positive(message = "Allocated amount must be greater than zero")
    private double allocatedAmount;

    @Min(value = 0, message = "Spent amount cannot be negative")
    private double spentAmount;

    private boolean overspendFlag;
    private double overspendPercentage;

    public Budget() {}

    public Budget(String department, String month, int year, double allocatedAmount, double spentAmount) {
        this.department = department;
        this.month = month;
        this.year = year;
        this.allocatedAmount = allocatedAmount;
        this.spentAmount = spentAmount;
        recalculate();
    }

    public void recalculate() {
        if (allocatedAmount > 0) {
            this.overspendPercentage = ((spentAmount - allocatedAmount) / allocatedAmount) * 100;
        } else {
            this.overspendPercentage = 0;
        }
        this.overspendFlag = spentAmount > allocatedAmount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public double getAllocatedAmount() { return allocatedAmount; }
    public void setAllocatedAmount(double allocatedAmount) { this.allocatedAmount = allocatedAmount; }
    public double getSpentAmount() { return spentAmount; }
    public void setSpentAmount(double spentAmount) { this.spentAmount = spentAmount; }
    public boolean isOverspendFlag() { return overspendFlag; }
    public void setOverspendFlag(boolean overspendFlag) { this.overspendFlag = overspendFlag; }
    public double getOverspendPercentage() { return overspendPercentage; }
    public void setOverspendPercentage(double overspendPercentage) { this.overspendPercentage = overspendPercentage; }
}
