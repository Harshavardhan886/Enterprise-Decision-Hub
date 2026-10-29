package com.edh.repository;

import com.edh.model.Budget;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends MongoRepository<Budget, String> {
    List<Budget> findByDepartment(String department);
    List<Budget> findByOverspendFlagTrue();
    Optional<Budget> findByDepartmentAndMonthAndYear(String department, String month, int year);
}
