package com.edh.controller;

import com.edh.model.AuditLog;
import com.edh.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public List<AuditLog> getAllLogs() {
        return auditLogService.getAllLogs();
    }

    @GetMapping("/entity/{entityType}")
    public List<AuditLog> getByEntityType(@PathVariable String entityType) {
        return auditLogService.getLogsByEntityType(entityType);
    }

    @GetMapping("/verify")
    public java.util.Map<String, Object> verifyLedgerIntegrity() {
        return auditLogService.verifyLedgerIntegrity();
    }
}
