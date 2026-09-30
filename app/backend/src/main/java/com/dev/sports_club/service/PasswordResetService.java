package com.dev.sports_club.service;

import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.security.PasswordPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Password reset by email. A link holds a random token that is valid once, for an hour; only a hash of it is stored.
 * Asking for a link never reveals whether an address has an account.
 */
@Service
public class PasswordResetService {

    static final int VALID_MINUTES = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository users;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final SessionRevoker sessions;
    private final AuditService audit;
    private final String publicUrl;

    public PasswordResetService(AppUserRepository users, JdbcTemplate jdbc, PasswordEncoder encoder, MailService mail,
                                SessionRevoker sessions, AuditService audit, @Value("${app.public-url:http://localhost:5173}") String publicUrl) {
        this.users = users;
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.mail = mail;
        this.sessions = sessions;
        this.audit = audit;
        this.publicUrl = publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
    }

    public boolean isAvailable() {
        return mail.isEnabled();
    }

    /** Emails a reset link to every active account with this address. Silent when there is none, or email is not set up. */
    @Transactional
    public void request(String email) {
        if (!mail.isEnabled() || email == null || email.isBlank()) return;
        List<AppUser> matches = users.findByEmailIgnoreCase(email.trim());
        for (AppUser user : matches) {
            if (!Boolean.TRUE.equals(user.getIsActive())) continue;
            byte[] raw = new byte[32];
            RANDOM.nextBytes(raw);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            jdbc.update("DELETE FROM password_reset_token WHERE user_id = ?", user.getUserId());   // an older link stops working
            jdbc.update("INSERT INTO password_reset_token (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                    MfaService.hash(token), user.getUserId(), LocalDateTime.now().plusMinutes(VALID_MINUTES));
            mail.send(user.getEmail(), "Reset your Sports Club Platform password",
                    "Someone asked to reset the password for the account \"" + user.getUsername() + "\".\n\n"
                            + "To choose a new password, open this link within " + VALID_MINUTES + " minutes:\n"
                            + publicUrl + "/reset-password?token=" + token + "\n\n"
                            + "If you did not ask for this, ignore this email. Your password has not been changed.");
            audit.recordFor(user.getUsername(), AuditAction.PASSWORD_RESET, "Password reset link requested for " + user.getUsername());
        }
    }

    /** Sets the new password if the token is genuine, unused and unexpired. Ends the person's other sessions. */
    @Transactional
    public void reset(String token, String newPassword) {
        String hash = MfaService.hash(token == null ? "" : token.trim());
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT user_id, expires_at, used_at FROM password_reset_token WHERE token_hash = ?", hash);
        if (rows.isEmpty() || rows.get(0).get("used_at") != null
                || ((java.sql.Timestamp) rows.get(0).get("expires_at")).toLocalDateTime().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleViolationException("This reset link is invalid or has expired. Ask for a new one");
        }
        AppUser user = users.findById(((Number) rows.get(0).get("user_id")).intValue()).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            throw new BusinessRuleViolationException("This reset link is invalid or has expired. Ask for a new one");
        }
        PasswordPolicy.validate(newPassword, user.getUsername());
        user.setPasswordHash(encoder.encode(newPassword));
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        users.save(user);
        jdbc.update("DELETE FROM password_reset_token WHERE user_id = ?", user.getUserId());
        sessions.revokeAll(user.getUsername());
        audit.recordFor(user.getUsername(), AuditAction.PASSWORD_RESET, user.getUsername() + " set a new password from a reset link");
    }
}
