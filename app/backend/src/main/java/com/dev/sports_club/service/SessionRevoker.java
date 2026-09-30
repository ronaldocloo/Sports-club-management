package com.dev.sports_club.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Signs a person out of every device by deleting their stored sessions (needs the database-backed session tables). */
@Component
public class SessionRevoker {

    private static final Logger log = LoggerFactory.getLogger(SessionRevoker.class);

    private final JdbcTemplate jdbc;

    public SessionRevoker(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void revokeAll(String username) {
        try {
            jdbc.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?", username);
        } catch (DataAccessException e) {
            log.warn("Could not revoke sessions (are the SPRING_SESSION tables installed?): {}", e.getClass().getSimpleName());
        }
    }
}
