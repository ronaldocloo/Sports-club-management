package com.dev.sports_club.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Slows down abuse: password guessing on the login endpoint, and heavy exports. Limits are per client
 * address per minute and can be tuned (or switched off, for tests) with app.rate-limit.* properties.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final RateLimiter login;
    private final RateLimiter exports;
    private final RateLimiter general;

    public RateLimitFilter(@Value("${app.rate-limit.enabled:true}") boolean enabled,
                           @Value("${app.rate-limit.login-per-minute:10}") int loginPerMinute,
                           @Value("${app.rate-limit.export-per-minute:20}") int exportPerMinute,
                           @Value("${app.rate-limit.general-per-minute:600}") int generalPerMinute) {
        this.enabled = enabled;
        this.login = new RateLimiter(loginPerMinute, 60_000);
        this.exports = new RateLimiter(exportPerMinute, 60_000);
        this.general = new RateLimiter(generalPerMinute, 60_000);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!enabled || !request.getRequestURI().startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }
        long now = System.currentTimeMillis();
        String client = request.getRemoteAddr();
        long wait = 0;
        if ("POST".equals(request.getMethod()) && request.getRequestURI().equals("/api/auth/login")) {
            wait = login.tryAcquire(client, now);
        } else if (request.getRequestURI().startsWith("/api/reports/") && request.getParameter("format") != null && !"json".equals(request.getParameter("format"))) {
            wait = exports.tryAcquire(client, now);
        }
        if (wait == 0) wait = general.tryAcquire(client, now);

        if (wait > 0) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, wait / 1000)));
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Too many requests. Please wait a moment and try again\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    @Scheduled(fixedDelay = 300_000)
    void prune() {
        long now = System.currentTimeMillis();
        login.prune(now);
        exports.prune(now);
        general.prune(now);
    }
}
