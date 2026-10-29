package com.edh.service;

import com.edh.model.*;
import com.edh.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedBudgetsIfEmpty();
        seedVendorsIfEmpty();
        seedInvoicesIfEmpty();
        seedAlertsIfEmpty();
        seedAuditLogsIfEmpty();
        System.out.println(">>> [EDH] System initialized successfully. Ready for Production & Local traffic.");
    }

    private void seedUsers() {
        seedUser("admin", "admin123", "ADMIN");
        seedUser("Harsha", "123456", "ADMIN");
        seedUser("tester1", "Password@123", "ADMIN");
    }

    private void seedUser(String username, String rawPassword, String role) {
        List<User> existingUsers = userRepository.findAllByUsernameIgnoreCase(username);
        if (!existingUsers.isEmpty()) {
            // User already exists — clean up duplicates but DO NOT reset the password.
            // This allows admins to change passwords without them being overwritten on restart.
            if (existingUsers.size() > 1) {
                for (int i = 1; i < existingUsers.size(); i++) {
                    userRepository.delete(existingUsers.get(i));
                }
            }
        } else {
            // Only seed the user if they don't exist at all
            User user = new User(username, passwordEncoder.encode(rawPassword), role);
            userRepository.save(user);
        }
    }

    private void seedBudgetsIfEmpty() {
        if (budgetRepository.count() == 0) {
            budgetRepository.save(new Budget("Finance", "March", 2026, 250000.0, 210000.0));
            budgetRepository.save(new Budget("Operations", "March", 2026, 150000.0, 165000.0)); // Overspending
            budgetRepository.save(new Budget("Engineering", "March", 2026, 500000.0, 380000.0));
            budgetRepository.save(new Budget("HR", "March", 2026, 100000.0, 62000.0));
            budgetRepository.save(new Budget("Marketing", "March", 2026, 200000.0, 185000.0));
            System.out.println(">>> [EDH] Seeded initial department budgets.");
        }
    }

    private void seedVendorsIfEmpty() {
        if (vendorRepository.count() == 0) {
            createVendor("Acme Cloud Services", 8, 0, "LOW", 1);
            createVendor("Global Logistics Corp", 12, 1, "LOW", 2);
            createVendor("Apex Marketing Group", 6, 1, "MEDIUM", 4);
            createVendor("NextGen Hardware Ltd", 4, 1, "MEDIUM", 5);
            createVendor("CyberShield Analytics", 3, 2, "HIGH", 8);
            System.out.println(">>> [EDH] Seeded initial vendors.");
        }
    }

    private void createVendor(String name, int total, int flagged, String level, int score) {
        Vendor v = new Vendor(name);
        v.setTotalInvoices(total);
        v.setFlaggedInvoices(flagged);
        v.setRiskLevel(level);
        v.setRiskScore(score);
        vendorRepository.save(v);
    }

    private void seedInvoicesIfEmpty() {
        if (invoiceRepository.count() == 0) {
            Invoice inv1 = new Invoice("INV-2026-001", "Acme Cloud Services", "Engineering", 45000.0, LocalDate.now().minusDays(12));
            inv1.setStatus("APPROVED");
            inv1.setRiskScore(1);
            invoiceRepository.save(inv1);

            Invoice inv2 = new Invoice("INV-2026-002", "Global Logistics Corp", "Operations", 82000.0, LocalDate.now().minusDays(8));
            inv2.setStatus("APPROVED");
            inv2.setRiskScore(2);
            invoiceRepository.save(inv2);

            Invoice inv3 = new Invoice("INV-2026-003", "Apex Marketing Group", "Marketing", 120000.0, LocalDate.now().minusDays(5));
            inv3.setStatus("PENDING");
            inv3.setRiskScore(4);
            invoiceRepository.save(inv3);

            Invoice inv4 = new Invoice("INV-2026-004", "CyberShield Analytics", "Operations", 165000.0, LocalDate.now().minusDays(3));
            inv4.setStatus("FLAGGED");
            inv4.setDuplicateFlag(true);
            inv4.setRiskScore(8);
            invoiceRepository.save(inv4);

            Invoice inv5 = new Invoice("INV-2026-005", "NextGen Hardware Ltd", "Finance", 95000.0, LocalDate.now().minusDays(1));
            inv5.setStatus("PENDING");
            inv5.setRiskScore(3);
            invoiceRepository.save(inv5);

            Invoice inv6 = new Invoice("INV-2026-006", "CyberShield Analytics", "Operations", 165000.0, LocalDate.now());
            inv6.setStatus("FLAGGED");
            inv6.setDuplicateFlag(true);
            inv6.setRiskScore(9);
            invoiceRepository.save(inv6);

            System.out.println(">>> [EDH] Seeded initial sample invoices.");
        }
    }

    private void seedAlertsIfEmpty() {
        if (alertRepository.count() == 0) {
            alertRepository.save(new Alert(
                "DUPLICATE_INVOICE",
                "INV-2026-004",
                "Operations",
                8,
                "Potential duplicate invoice detected: INV-2026-004 from CyberShield Analytics",
                "Hold payment and verify duplicate submission with vendor."
            ));
            alertRepository.save(new Alert(
                "BUDGET_OVERSPEND",
                "BUDGET-OPS",
                "Operations",
                7,
                "Operations department budget exceeded by 10% for March 2026.",
                "Escalate to operations head and freeze non-essential purchases."
            ));
            System.out.println(">>> [EDH] Seeded initial governance alerts.");
        }
    }

    private void seedAuditLogsIfEmpty() {
        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(new AuditLog(
                "SYSTEM_INITIALIZED",
                "System",
                "SYSTEM-ROOT",
                "System",
                "Enterprise Decision Hub data models and governance policies initialized."
            ));
            auditLogRepository.save(new AuditLog(
                "INVOICE_FLAGGED",
                "Invoice",
                "INV-2026-004",
                "ML_RISK_ENGINE",
                "Invoice flagged with risk score 8 due to duplicate amount and vendor match."
            ));
            System.out.println(">>> [EDH] Seeded initial audit logs.");
        }
    }
}
