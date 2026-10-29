package com.edh.service;

import com.edh.model.AuditLog;
import com.edh.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void logPersistsAuditEntry() {
        auditLogService.log("CREATE", "Invoice", "inv-1", "SYSTEM", "Invoice created");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertEquals("CREATE", saved.getAction());
        assertEquals("Invoice", saved.getEntityType());
        assertEquals("inv-1", saved.getEntityId());
        assertEquals("SYSTEM", saved.getPerformedBy());
        assertEquals("Invoice created", saved.getDetails());
    }

    @Test
    void getLogsByEntityTypeDelegatesToRepository() {
        AuditLog log = new AuditLog("UPDATE", "Budget", "budget-1", "USER", "Updated");
        when(auditLogRepository.findByEntityType("Budget")).thenReturn(List.of(log));

        List<AuditLog> result = auditLogService.getLogsByEntityType("Budget");

        assertEquals(1, result.size());
        assertEquals("Budget", result.get(0).getEntityType());
    }
}
