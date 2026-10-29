package com.edh.controller;

import com.edh.model.Budget;
import com.edh.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public List<Budget> getAllBudgets() {
        return budgetService.getAllBudgets();
    }

    @GetMapping("/department/{department}")
    public List<Budget> getByDepartment(@PathVariable String department) {
        return budgetService.getBudgetsByDepartment(department);
    }

    @GetMapping("/overspending")
    public List<Budget> getOverspending() {
        return budgetService.getOverspendingBudgets();
    }

    @PostMapping
    public ResponseEntity<Budget> createBudget(@jakarta.validation.Valid @RequestBody Budget budget) {
        return ResponseEntity.ok(budgetService.createBudget(budget));
    }

    @PutMapping("/{id}/spend")
    public ResponseEntity<Budget> updateSpend(@PathVariable String id, @RequestBody Map<String, Double> body) {
        return budgetService.updateSpend(id, body.get("spentAmount"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable String id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }
}
