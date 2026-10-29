package com.edh.service;

import com.edh.model.Alert;
import com.edh.model.Invoice;
import com.edh.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private LlmAdvisoryService llmAdvisoryService;

    public Alert createAlert(String type, String relatedEntityId, String department,
                              int riskScore, String message, String recommendation) {
        Alert alert = new Alert(type, relatedEntityId, department, riskScore, message, recommendation);
        alert.setSentryLevel(Invoice.computeSentryLevel(riskScore));
        if (llmAdvisoryService != null) {
            try {
                alert.setExecutiveSummary(llmAdvisoryService.generateAlertSummary(type, department, riskScore, message, recommendation));
            } catch (Exception e) {
                // fallback gracefully
            }
        }
        Alert saved = alertRepository.save(alert);
        auditLogService.log("ALERT_CREATED", "Alert", saved.getId(), "SYSTEM",
                type + " for " + department + " - risk score " + riskScore);
        return saved;
    }

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public List<Alert> getAlertsByStatus(String status) {
        return alertRepository.findByStatus(status);
    }

    public List<Alert> getAlertsByDepartment(String department) {
        return alertRepository.findByDepartment(department);
    }

    public Optional<Alert> updateStatus(String id, String newStatus) {
        Optional<Alert> alertOpt = alertRepository.findById(id);
        if (alertOpt.isPresent()) {
            Alert alert = alertOpt.get();
            alert.setStatus(newStatus);
            Alert saved = alertRepository.save(alert);
            auditLogService.log("ALERT_STATUS_UPDATED", "Alert", id, "USER", "status -> " + newStatus);
            return Optional.of(saved);
        }
        return Optional.empty();
    }
}
