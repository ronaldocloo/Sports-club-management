package com.dev.sports_club.tenant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Turns on the per-organization Hibernate filter for the request's EntityManager. */
@Component
public class TenantFilterInterceptor implements HandlerInterceptor {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Integer organizationId = TenantContext.get();
        boolean write = !request.getMethod().equals("GET") && !request.getMethod().equals("HEAD") && !request.getMethod().equals("OPTIONS");
        String path = request.getRequestURI();
        boolean orgFree = path.startsWith("/api/organizations") || path.startsWith("/api/auth") || path.startsWith("/api/users");
        if (write && organizationId != null && organizationId == TenantContext.NONE && !orgFree) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            try {
                response.getWriter().write("{\"status\":400,\"error\":\"Bad Request\",\"message\":\"Select an organization first\"}");
            } catch (java.io.IOException e) {
                throw new IllegalStateException(e);
            }
            return false;
        }
        Session session = entityManager.unwrap(Session.class);
        if (organizationId == null) {
            session.disableFilter("tenant");
        } else {
            session.enableFilter("tenant").setParameter("orgId", organizationId);
        }
        return true;
    }
}
