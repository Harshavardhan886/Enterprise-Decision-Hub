package com.edh.service;

import com.edh.model.Alert;
import com.edh.repository.AlertRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.AdditionalAnswers;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AlertService alertService;

    @Test
    void createAlertSavesAndLogs() {
        when(alertRepository.save(any(Alert.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());

        Alert result = alertService.createAlert("BUDGET_OVERSPEND", "budget-1", "Finance", 8,
                "Budget exceeded", "Review spend");

        assertEquals("BUDGET_OVERSPEND", result.getType());
        assertEquals("budget-1", result.getRelatedEntityId());
        verify(alertRepository).save(any(Alert.class));
        verify(auditLogService).log(eq("ALERT_CREATED"), eq("Alert"), eq(result.getId()), eq("SYSTEM"),
                contains("Finance"));
    }

    @Test
    void updateStatusChangesExistingAlert() {
        Alert existing = new Alert("BUDGET_OVERSPEND", "budget-1", "Finance", 8, "Budget exceeded", "Review spend");
        existing.setId("alert-1");
        when(alertRepository.findById("alert-1")).thenReturn(Optional.of(existing));
        when(alertRepository.save(any(Alert.class))).thenAnswer(AdditionalAnswers.returnsFirstArg());

        Optional<Alert> updated = alertService.updateStatus("alert-1", "ACKNOWLEDGED");

        assertTrue(updated.isPresent());
        assertEquals("ACKNOWLEDGED", updated.get().getStatus());
        verify(auditLogService).log(eq("ALERT_STATUS_UPDATED"), eq("Alert"), eq("alert-1"), eq("USER"),
                contains("ACKNOWLEDGED"));
    }
}
