package com.edh.repository;

import com.edh.model.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AlertRepository extends MongoRepository<Alert, String> {
    List<Alert> findByStatus(String status);
    List<Alert> findByDepartment(String department);
    List<Alert> findByType(String type);
}
