package com.dev.sports_club.config;

import com.dev.sports_club.entity.AppUser;
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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            AppUser user = repository.findByUsername(auth.getName()).orElse(null);
            boolean valid = user != null
                    && Boolean.TRUE.equals(user.getIsActive())
                    && auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
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
        chain.doFilter(request, response);
    }
}
