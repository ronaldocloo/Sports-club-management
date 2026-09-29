package com.dev.sports_club.service;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.*;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Writes the audit trail. Failures here must never break the request being audited. */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository repository;
    private final AppUserRepository userRepository;

    /** Records an action by the signed-in user in the caller's organization. */
    public void record(AuditAction action, String entityType, String entityId, String description) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null && auth.isAuthenticated() ? auth.getName() : "anonymous";
        AppUser user = userRepository.findByUsername(username).orElse(null);
        write(action, username, user, orgOf(user), entityType, entityId, description);
    }

    /** Records an event for a named user, for example a login (there is no session yet). */
    public void recordFor(String username, AuditAction action, String description) {
        AppUser user = userRepository.findByUsername(username).orElse(null);
        write(action, username, user, user != null ? user.getOrganizationId() : null, null, null, description);
    }

    private Integer orgOf(AppUser user) {
        return TenantContext.hasOrganization() ? TenantContext.get() : user != null ? user.getOrganizationId() : null;
    }

    private void write(AuditAction action, String username, AppUser user, Integer org, String type, String id, String description) {
        try {
            AuditLog log = new AuditLog();
            log.setOrganizationId(org);
            log.setUserId(user != null ? user.getUserId() : null);
            log.setUsername(username.length() > 50 ? username.substring(0, 50) : username);
            log.setAction(action);
            log.setEntityType(type);
            log.setEntityId(id);
            log.setDescription(description.length() > 255 ? description.substring(0, 254) + "…" : description);
            repository.save(log);
        } catch (RuntimeException e) {
            // Never let auditing break the action that was audited.
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> search(String entityType, String q, int limit) {
        Integer org = TenantContext.hasOrganization() ? TenantContext.get() : null;
        return repository.search(org, blankToNull(entityType), blankToNull(q), org2Page(limit)).stream()
                .map(a -> new AuditLogResponse(a.getAuditId(), a.getUsername(), a.getAction(), a.getEntityType(), a.getEntityId(), a.getDescription(), a.getCreatedAt()))
                .toList();
    }

    private static org.springframework.data.domain.Pageable org2Page(int limit) {
        return org.springframework.data.domain.PageRequest.of(0, Math.max(1, Math.min(limit, 500)));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
