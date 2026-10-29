package com.edh.service;

import com.edh.model.Alert;
import com.edh.model.Budget;
import com.edh.model.Invoice;
import com.edh.model.Vendor;
import com.edh.repository.AlertRepository;
import com.edh.repository.BudgetRepository;
import com.edh.repository.InvoiceRepository;
import com.edh.repository.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private BudgetRepository budgetRepository;
    @Autowired private AlertRepository alertRepository;
    @Autowired private VendorRepository vendorRepository;

    public Map<String, Object> getMetrics() {
        List<Invoice> invoices = invoiceRepository.findAll();
        List<Budget> budgets = budgetRepository.findAll();
        List<Alert> alerts = alertRepository.findAll();
        List<Vendor> vendors = vendorRepository.findAll();

        Map<String, Object> m = new LinkedHashMap<>();

        // Invoices
        m.put("totalInvoices", invoices.size());
        m.put("flaggedInvoices", invoices.stream().filter(Invoice::isDuplicateFlag).count());
        m.put("approvedInvoices", invoices.stream().filter(i -> "APPROVED".equals(i.getStatus())).count());
        m.put("pendingInvoices", invoices.stream().filter(i -> "PENDING".equals(i.getStatus())).count());

        // Sentry Distribution (0-3: GREEN, 4-6: YELLOW, 7-8: ORANGE, 9-10: RED)
        long sentryGreen = invoices.stream().filter(i -> i.getRiskScore() <= 3).count();
        long sentryYellow = invoices.stream().filter(i -> i.getRiskScore() >= 4 && i.getRiskScore() <= 6).count();
        long sentryOrange = invoices.stream().filter(i -> i.getRiskScore() >= 7 && i.getRiskScore() <= 8).count();
        long sentryRed = invoices.stream().filter(i -> i.getRiskScore() >= 9).count();
        m.put("sentryGreen", sentryGreen);
        m.put("sentryYellow", sentryYellow);
        m.put("sentryOrange", sentryOrange);
        m.put("sentryRed", sentryRed);

        // Surplus Expenses (>1.5x dept average or >2x vendor average)
        long surplusCount = invoices.stream().filter(i -> i.isSurplusExpenseFlag() || i.isVendorSurplusFlag()).count();
        double surplusValue = invoices.stream()
                .filter(i -> i.isSurplusExpenseFlag() || i.isVendorSurplusFlag())
                .mapToDouble(Invoice::getAmount).sum();
        m.put("surplusInvoicesCount", surplusCount);
        m.put("surplusTotalValue", surplusValue);

        // Risk distribution buckets for bar chart
        long[] buckets = new long[5]; // 0-1, 2-3, 4-5, 6-7, 8-10
        for (Invoice inv : invoices) {
            int s = inv.getRiskScore();
            if (s <= 1) buckets[0]++;
            else if (s <= 3) buckets[1]++;
            else if (s <= 5) buckets[2]++;
            else if (s <= 7) buckets[3]++;
            else buckets[4]++;
        }
        List<Map<String, Object>> riskDist = new ArrayList<>();
        String[] ranges = {"0–1", "2–3", "4–5", "6–7", "8–10"};
        for (int i = 0; i < 5; i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("range", ranges[i]);
            row.put("count", buckets[i]);
            riskDist.add(row);
        }
        m.put("invoiceRiskDistribution", riskDist);

        // Budgets
        m.put("totalBudgets", budgets.size());
        long overspending = budgets.stream().filter(Budget::isOverspendFlag).count();
        m.put("overspendingBudgets", overspending);

        // Budget utilisation per department for bar chart
        Map<String, double[]> deptAgg = new LinkedHashMap<>();
        for (Budget b : budgets) {
            deptAgg.computeIfAbsent(b.getDepartment(), k -> new double[]{0, 0});
            deptAgg.get(b.getDepartment())[0] += b.getSpentAmount();
            deptAgg.get(b.getDepartment())[1] += b.getAllocatedAmount();
        }
        List<Map<String, Object>> budgetUtil = new ArrayList<>();
        for (Map.Entry<String, double[]> e : deptAgg.entrySet()) {
            double allocated = e.getValue()[1];
            double spent = e.getValue()[0];
            double pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            double roundedPct = Math.round(pct * 10.0) / 10.0;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("department", e.getKey());
            row.put("utilisationPct", roundedPct);
            row.put("utilisation", roundedPct);
            row.put("spentAmount", spent);
            row.put("allocatedAmount", allocated);
            budgetUtil.add(row);
        }
        m.put("budgetUtilisation", budgetUtil);

        // Alerts
        m.put("totalAlerts", alerts.size());
        List<Alert> activeAlertList = alerts.stream().filter(a -> !"RESOLVED".equalsIgnoreCase(a.getStatus())).collect(Collectors.toList());
        m.put("activeAlerts", activeAlertList.size());
        m.put("criticalAlerts", activeAlertList.stream().filter(a -> a.getRiskScore() >= 7).count());
        m.put("mediumAlerts", activeAlertList.stream().filter(a -> a.getRiskScore() >= 4 && a.getRiskScore() < 7).count());
        m.put("lowAlerts", activeAlertList.stream().filter(a -> a.getRiskScore() < 4).count());

        // 5 most recent alerts
        List<Alert> recent = alerts.stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .limit(5)
                .collect(Collectors.toList());
        m.put("recentAlerts", recent);

        // Vendors
        m.put("totalVendors", vendors.size());
        m.put("highRiskVendors", vendors.stream().filter(v -> "HIGH".equals(v.getRiskLevel())).count());
        m.put("mediumRiskVendors", vendors.stream().filter(v -> "MEDIUM".equals(v.getRiskLevel())).count());
        m.put("lowRiskVendors", vendors.stream().filter(v -> "LOW".equals(v.getRiskLevel())).count());

        return m;
    }
}
