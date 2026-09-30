package com.dev.sports_club.config;

import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.service.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Records every successful create, update and delete made through the API: who did it, to what,
 * and when. Runs after Spring Security, so the signed-in user and organization are known.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class AuditFilter extends OncePerRequestFilter {

    private static final Set<String> WRITES = Set.of("POST", "PUT", "DELETE");
    // Not audited here: sign-in has its own entries, and reading/clearing notifications is noise.
    private static final Set<String> SKIPPED = Set.of("auth", "notifications", "audit-logs", "admin");
    private static final Pattern ID_FIELD = Pattern.compile("\"([A-Za-z]+Id)\"\\s*:\\s*(\\d+)");

    private final AuditService audit;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String[] parts = request.getRequestURI().split("/");
        boolean audited = WRITES.contains(request.getMethod()) && parts.length > 2 && "api".equals(parts[1]) && !SKIPPED.contains(parts[2]);
        if (!audited) {
            chain.doFilter(request, response);
            return;
        }

        ContentCachingResponseWrapper wrapper = new ContentCachingResponseWrapper(response);
        try {
            chain.doFilter(request, wrapper);
            int status = wrapper.getStatus();
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (status >= 200 && status < 300 && auth != null && auth.isAuthenticated()) {
                record(request, wrapper, parts, auth.getName());
            }
        } finally {
            wrapper.copyBodyToResponse();
        }
    }

    private void record(HttpServletRequest request, ContentCachingResponseWrapper wrapper, String[] parts, String user) {
        String resource = parts[2];
        String entity = singular(resource).replace('-', ' ');
        String id = null;
        for (int i = parts.length - 1; i >= 3; i--) {
            if (parts[i].matches("\\d+")) { id = parts[i]; break; }
        }
        String detail = parts.length > 3 && !parts[parts.length - 1].matches("\\d+") ? " (" + parts[parts.length - 1].replace('-', ' ') + ")" : "";
        AuditAction action = switch (request.getMethod()) {
            case "POST" -> AuditAction.CREATE;
            case "DELETE" -> AuditAction.DELETE;
            default -> AuditAction.UPDATE;
        };
        if (id == null && action == AuditAction.CREATE) {
            Matcher m = ID_FIELD.matcher(new String(wrapper.getContentAsByteArray(), StandardCharsets.UTF_8));
            if (m.find()) id = m.group(2);
        }
        String verb = switch (action) { case CREATE -> "created"; case DELETE -> "deleted"; default -> "updated"; };
        audit.record(action, entity, id, user + " " + verb + " " + entity + (id != null ? " #" + id : "") + detail);
    }

    private static String singular(String resource) {
        String r = resource.toLowerCase(Locale.ROOT);
        if (r.endsWith("ies")) return r.substring(0, r.length() - 3) + "y";
        if (r.endsWith("s")) return r.substring(0, r.length() - 1);
        return r;
    }
}
