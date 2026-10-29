package com.edh.service;

import com.edh.model.Budget;
import com.edh.repository.AlertRepository;
import com.edh.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AlertService alertService;

    @Autowired
    private AuditLogService auditLogService;

    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public List<Budget> getBudgetsByDepartment(String department) {
        return budgetRepository.findByDepartment(department);
    }

    public List<Budget> getOverspendingBudgets() {
        return budgetRepository.findByOverspendFlagTrue();
    }

    public Budget createBudget(Budget budget) {
        budget.recalculate();
        Budget saved = budgetRepository.save(budget);

        auditLogService.log("BUDGET_CREATED", "Budget", saved.getId(), "SYSTEM",
                saved.getDepartment() + " " + saved.getMonth() + "/" + saved.getYear());

        if (saved.isOverspendFlag()) {
            createOverspendAlertIfNotExists(saved);
        }

        return saved;
    }

    public Optional<Budget> updateSpend(String id, double newSpentAmount) {
        Optional<Budget> budgetOpt = budgetRepository.findById(id);
        budgetOpt.ifPresent(budget -> {
            budget.setSpentAmount(newSpentAmount);
            budget.recalculate();
            budgetRepository.save(budget);
            auditLogService.log("BUDGET_UPDATED", "Budget", id, "USER", "spent -> " + newSpentAmount);

            if (budget.isOverspendFlag()) {
                createOverspendAlertIfNotExists(budget);
            }
        });
        return budgetOpt;
    }

    public void deleteBudget(String id) {
        budgetRepository.deleteById(id);
        auditLogService.log("BUDGET_DELETED", "Budget", id, "USER", "Budget deleted");
    }

    /**
     * Only creates a BUDGET_OVERSPEND alert if there isn't already an unresolved
     * one for the same budget entity. Prevents duplicate alert spam on every spend update.
     */
    private void createOverspendAlertIfNotExists(Budget budget) {
        boolean alreadyAlerted = alertRepository.findAll().stream()
                .anyMatch(a -> "BUDGET_OVERSPEND".equals(a.getType())
                        && budget.getId().equals(a.getRelatedEntityId())
                        && !"RESOLVED".equals(a.getStatus()));
        if (!alreadyAlerted) {
            int score = budget.getOverspendPercentage() >= 20 ? 8 : 5;
            alertService.createAlert("BUDGET_OVERSPEND", budget.getId(), budget.getDepartment(),
                    score,
                    budget.getDepartment() + " exceeded budget by " + Math.round(budget.getOverspendPercentage()) + "%",
                    "Review department spend and freeze non-essential purchases");
        }
    }
}
