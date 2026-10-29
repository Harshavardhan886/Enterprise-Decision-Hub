package com.edh.controller;

import com.edh.model.Alert;
import com.edh.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @GetMapping("/status/{status}")
    public List<Alert> getByStatus(@PathVariable String status) {
        return alertService.getAlertsByStatus(status);
    }

    @GetMapping("/department/{department}")
    public List<Alert> getByDepartment(@PathVariable String department) {
        return alertService.getAlertsByDepartment(department);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Alert> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        return alertService.updateStatus(id, body.get("status"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
