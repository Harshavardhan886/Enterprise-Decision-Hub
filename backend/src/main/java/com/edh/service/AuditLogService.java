package com.edh.service;

import com.edh.model.AuditLog;
import com.edh.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(String action, String entityType, String entityId, String performedBy, String details) {
        AuditLog logEntry = new AuditLog(action, entityType, entityId, performedBy, details);
        auditLogRepository.save(logEntry);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    public List<AuditLog> getLogsByEntityType(String entityType) {
        return auditLogRepository.findByEntityType(entityType);
    }
}
