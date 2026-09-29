package com.dev.sports_club.config;

import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.AppUserRole;
import com.dev.sports_club.entity.Organization;
import com.dev.sports_club.entity.OrganizationStatus;
import com.dev.sports_club.repository.OrganizationRepository;
import com.dev.sports_club.tenant.TenantContext;
import com.dev.sports_club.repository.AppUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Re-checks the signed-in account on every request. A session opened before the account was
 * deactivated, deleted, or given a different role is ended immediately rather than staying valid
 * until it times out.
 */
@Component
@RequiredArgsConstructor
public class ActiveUserFilter extends OncePerRequestFilter {

    private final AppUserRepository repository;
    private final OrganizationRepository organizationRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            AppUser user = repository.findByUsername(auth.getName()).orElse(null);
            boolean valid = user != null
                    && Boolean.TRUE.equals(user.getIsActive())
                    && auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            Organization organization = valid && user.getOrganizationId() != null
                    ? organizationRepository.findById(user.getOrganizationId()).orElse(null) : null;
            if (valid && user.getOrganizationId() != null
                    && (organization == null || organization.getStatus() == OrganizationStatus.Suspended)) {
                valid = false;
            }
            if (!valid) {
                SecurityContextHolder.clearContext();
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Your session is no longer valid. Please sign in again\"}");
                return;
            }
        }
        try {
            TenantContext.set(resolveOrganization(auth, request));
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * The organization this request works in: the user's own, or for a Super Admin the one chosen with
     * the X-Organization-Id header. With no valid choice nothing is visible.
     */
    private Integer resolveOrganization(Authentication auth, HttpServletRequest request) {
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        AppUser user = repository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return TenantContext.NONE;
        }
        if (user.getRole() == AppUserRole.SuperAdmin) {
            String header = request.getHeader("X-Organization-Id");
            try {
                Integer id = header == null ? null : Integer.valueOf(header.trim());
                return id != null && organizationRepository.existsById(id) ? id : TenantContext.NONE;
            } catch (NumberFormatException e) {
                return TenantContext.NONE;
            }
        }
        return user.getOrganizationId() != null ? user.getOrganizationId() : TenantContext.NONE;
    }
}
