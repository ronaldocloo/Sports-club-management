package com.dev.sports_club.demo;

import com.dev.sports_club.security.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first platform administrator on a fresh install, so nobody has to write SQL by hand.
 * Does nothing unless a password is configured, and nothing once a Super Admin exists. The password
 * must meet the normal password policy, otherwise the app refuses to start rather than run with a weak one.
 */
@Component
public class SuperAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminBootstrap.class);

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final String username;
    private final String password;

    public SuperAdminBootstrap(JdbcTemplate jdbc, PasswordEncoder encoder,
                               @Value("${app.bootstrap.superadmin-username:superadmin}") String username,
                               @Value("${app.bootstrap.superadmin-password:}") String password) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (password == null || password.isBlank()) return;
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE role = 'SuperAdmin'", Integer.class);
        if (existing != null && existing > 0) {
            log.info("A Super Admin already exists; the bootstrap password is ignored. You can remove it from the configuration.");
            return;
        }
        PasswordPolicy.validate(password, username);
        jdbc.update("INSERT INTO app_user (username, password_hash, role, organization_id, is_active) VALUES (?, ?, 'SuperAdmin', NULL, 1)",
                username, encoder.encode(password));
        log.warn("Created Super Admin '{}'. Remove the bootstrap password from the configuration now.", username);
    }
}
