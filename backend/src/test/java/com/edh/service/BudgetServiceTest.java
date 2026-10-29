package com.edh.service;

import com.edh.model.Budget;
import com.edh.repository.AlertRepository;
import com.edh.repository.BudgetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.AdditionalAnswers;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AlertService alertService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private BudgetService budgetService;

    @Test
    void createBudgetAlertsWhenBudgetIsOverspent() {
        Budget budget = new Budget("Finance", "August", 2026, 100, 120);
        budget.setId("budget-1");
        when(budgetRepository.save(any(Budget.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());
        when(alertRepository.findAll()).thenReturn(Collections.emptyList());

        Budget saved = budgetService.createBudget(budget);

        assertTrue(saved.isOverspendFlag());
        verify(auditLogService).log(eq("BUDGET_CREATED"), eq("Budget"), eq("budget-1"), eq("SYSTEM"),
                contains("Finance"));
        verify(alertService).createAlert(eq("BUDGET_OVERSPEND"), eq("budget-1"), eq("Finance"), eq(8),
                contains("exceeded budget"), anyString());
    }

    @Test
    void updateSpendDoesNotAlertWhenBudgetRemainsBalanced() {
        Budget budget = new Budget("Ops", "July", 2026, 100, 90);
        budget.setId("budget-2");
        when(budgetRepository.findById("budget-2")).thenReturn(Optional.of(budget));
        when(budgetRepository.save(any(Budget.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());

        Optional<Budget> updated = budgetService.updateSpend("budget-2", 90);

        assertTrue(updated.isPresent());
        assertFalse(updated.get().isOverspendFlag());
        verify(alertService, never()).createAlert(anyString(), anyString(), anyString(), anyInt(), anyString(), anyString());
    }
}
