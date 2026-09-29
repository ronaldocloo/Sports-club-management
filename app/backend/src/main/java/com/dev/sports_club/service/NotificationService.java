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

/** Creates and reads in-app notifications. Each alert is one row per recipient. */
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository repository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForCurrentUser() {
        return repository.findTop100ByUserIdOrderByCreatedAtDescNotificationIdDesc(currentUser().getUserId()).stream()
                .map(this::toResponse).toList();
    }

    public void markRead(Integer id) {
        Notification n = owned(id);
        n.setIsRead(true);
        repository.save(n);
    }

    public int markAllRead() {
        return repository.markAllRead(currentUser().getUserId());
    }

    public void delete(Integer id) {
        repository.delete(owned(id));
    }

    /** Sends an alert to every active user in the organization holding one of the roles. */
    public void notifyRoles(Integer organizationId, Collection<AppUserRole> roles, NotificationKind kind,
                            String message, String link, String dedupeKey) {
        if (organizationId == null) return;
        userRepository.findByOrganizationIdAndRoleInAndIsActiveTrue(organizationId, roles)
                .forEach(u -> send(u, kind, message, link, dedupeKey));
    }

    public void notifyUsers(Collection<AppUser> users, NotificationKind kind, String message, String link, String dedupeKey) {
        users.forEach(u -> send(u, kind, message, link, dedupeKey));
    }

    private void send(AppUser user, NotificationKind kind, String message, String link, String dedupeKey) {
        String key = dedupeKey == null ? null : truncate(dedupeKey, 100);
        if (key != null && repository.existsByUserIdAndDedupeKey(user.getUserId(), key)) {
            return;
        }
        Notification n = new Notification();
        n.setUserId(user.getUserId());
        n.setOrganizationId(user.getOrganizationId());
        n.setKind(kind);
        n.setMessage(truncate(message, 255));
        n.setLink(link);
        n.setDedupeKey(key);
        n.setIsRead(false);
        repository.save(n);
    }

    private Notification owned(Integer id) {
        Notification n = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Notification not found: " + id));
        if (!n.getUserId().equals(currentUser().getUserId())) {
            throw new EntityNotFoundException("Notification not found: " + id);
        }
        return n;
    }

    private AppUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsername(auth.getName()).orElseThrow(() -> new AccessDeniedException("Unknown user"));
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getNotificationId(), n.getKind(), n.getMessage(), n.getLink(), n.getIsRead(), n.getCreatedAt());
    }
}
