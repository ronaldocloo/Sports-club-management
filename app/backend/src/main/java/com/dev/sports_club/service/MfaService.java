package com.dev.sports_club.service;

import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.security.Totp;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

/** Two-step sign-in with an authenticator app, plus one-time recovery codes for a lost phone. */
@Service
@RequiredArgsConstructor
public class MfaService {

    public static final String ISSUER = "Sports Club Platform";
    private static final int RECOVERY_CODES = 10;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // no 0/O/1/I to avoid misreading
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    /** Step 1: create a secret for the person to add to their authenticator app. Not active until confirmed. */
    @Transactional
    public Map<String, String> setup(String username) {
        AppUser user = load(username);
        if (Boolean.TRUE.equals(user.getMfaEnabled())) throw new BusinessRuleViolationException("Two-step sign-in is already on. Turn it off first to enrol again");
        String secret = Totp.newSecret();
        user.setMfaSecret(secret);
        user.setMfaLastStep(null);
        users.save(user);
        return Map.of("secret", secret, "otpauthUri", Totp.uri(ISSUER, username, secret));
    }

    /** Step 2: the person proves the app works by entering a code. Returns the recovery codes, shown only this once. */
    @Transactional
    public List<String> enable(String username, String code) {
        AppUser user = load(username);
        if (Boolean.TRUE.equals(user.getMfaEnabled())) throw new BusinessRuleViolationException("Two-step sign-in is already on");
        if (user.getMfaSecret() == null) throw new BusinessRuleViolationException("Start setup first");
        long step = Totp.verify(user.getMfaSecret(), code, System.currentTimeMillis(), null);
        if (step < 0) throw new BusinessRuleViolationException("That code is not right. Check the time on your phone and try again");
        user.setMfaEnabled(true);
        user.setMfaLastStep(step);
        users.save(user);

        jdbc.update("DELETE FROM mfa_recovery_code WHERE user_id = ?", user.getUserId());
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODES; i++) {
            String raw = randomCode();
            codes.add(raw.substring(0, 5) + "-" + raw.substring(5));
            jdbc.update("INSERT INTO mfa_recovery_code (code_hash, user_id) VALUES (?, ?)", hash(raw), user.getUserId());
        }
        audit.recordFor(username, AuditAction.MFA_ENABLED, username + " turned on two-step sign-in");
        return codes;
    }

    /** Turning it off needs the password and a current code (or a recovery code), so a borrowed session cannot do it. */
    @Transactional
    public void disable(String username, String password, String code) {
        AppUser user = load(username);
        if (!Boolean.TRUE.equals(user.getMfaEnabled())) throw new BusinessRuleViolationException("Two-step sign-in is not on");
        if (!encoder.matches(password, user.getPasswordHash())) throw new BusinessRuleViolationException("Password is incorrect");
        if (!verifyLogin(user, code)) throw new BusinessRuleViolationException("That code is not right");
        clear(user);
        users.save(user);
        audit.recordFor(username, AuditAction.MFA_DISABLED, username + " turned off two-step sign-in");
    }

    /** Wipes the secret and recovery codes. */
    @Transactional
    public void clear(AppUser user) {
        user.setMfaSecret(null);
        user.setMfaEnabled(false);
        user.setMfaLastStep(null);
        jdbc.update("DELETE FROM mfa_recovery_code WHERE user_id = ?", user.getUserId());
    }

    /** An administrator switches it off for someone who lost their phone; recorded against the administrator. */
    @Transactional
    public void resetByAdmin(AppUser user) {
        clear(user);
        audit.record(AuditAction.MFA_DISABLED, "user", String.valueOf(user.getUserId()), "Two-step sign-in was reset for " + user.getUsername());
    }

    /**
     * True if the code is a valid authenticator code that has not been used, or an unused recovery code (which is then
     * used up). Saves the accepted step on the user, which the caller must not overwrite.
     */
    @Transactional
    public boolean verifyLogin(AppUser user, String submitted) {
        if (submitted == null || submitted.isBlank()) return false;
        long step = Totp.verify(user.getMfaSecret(), submitted, System.currentTimeMillis(), user.getMfaLastStep());
        if (step >= 0) {
            user.setMfaLastStep(step);
            users.save(user);
            return true;
        }
        String normalized = submitted.replaceAll("[\\s-]", "").toUpperCase();
        if (normalized.length() != 10) return false;
        return jdbc.update("UPDATE mfa_recovery_code SET used_at = NOW() WHERE code_hash = ? AND user_id = ? AND used_at IS NULL", hash(normalized), user.getUserId()) == 1;
    }

    public int remainingRecoveryCodes(Integer userId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM mfa_recovery_code WHERE user_id = ? AND used_at IS NULL", Integer.class, userId);
        return n == null ? 0 : n;
    }

    private AppUser load(String username) {
        return users.findByUsername(username).orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + username));
    }

    private static String randomCode() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
        return sb.toString();
    }

    static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
