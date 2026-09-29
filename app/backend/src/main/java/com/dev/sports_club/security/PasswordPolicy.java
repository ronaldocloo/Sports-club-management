package com.dev.sports_club.security;

import com.dev.sports_club.exception.BusinessRuleViolationException;

import java.util.Locale;
import java.util.Set;

/** Rules for new and changed passwords. Existing passwords are not affected until they are changed. */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;

    private static final Set<String> COMMON = Set.of(
            "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop",
            "admin123", "administrator", "letmein123", "welcome123", "iloveyou1", "abc12345", "11111111", "00000000");

    private PasswordPolicy() { }

    /** Throws with a message a person can act on if the password is not acceptable. */
    public static void validate(String password, String username) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BusinessRuleViolationException("Password must be at least " + MIN_LENGTH + " characters");
        }
        boolean letter = password.chars().anyMatch(Character::isLetter);
        boolean digit = password.chars().anyMatch(Character::isDigit);
        if (!letter || !digit) {
            throw new BusinessRuleViolationException("Password must contain at least one letter and one number");
        }
        String lower = password.toLowerCase(Locale.ROOT);
        if (COMMON.contains(lower)) {
            throw new BusinessRuleViolationException("That password is too common. Choose something less predictable");
        }
        if (username != null && !username.isBlank() && lower.contains(username.toLowerCase(Locale.ROOT)) && username.length() >= 3) {
            throw new BusinessRuleViolationException("Password must not contain the username");
        }
    }
}
