package com.dev.sports_club.controller;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService service;

    @GetMapping
    public List<AuditLogResponse> search(@RequestParam(required = false) String entityType,
                                         @RequestParam(required = false) String q,
                                         @RequestParam(defaultValue = "200") int limit) {
        return service.search(entityType, q, limit);
    }
}
