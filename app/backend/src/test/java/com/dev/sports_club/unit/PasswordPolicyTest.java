package com.dev.sports_club.unit;

import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.security.PasswordPolicy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyTest {

    @Test
    void acceptsAReasonablePassword() {
        assertThatCode(() -> PasswordPolicy.validate("Sunrise2026", "kwame")).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @CsvSource({"short1,at least 8", "onlyletters,letter and one number", "12345678,letter and one number", "password123,too common", "Admin123,too common"})
    void rejectsWeakPasswords(String password, String reason) {
        assertThatThrownBy(() -> PasswordPolicy.validate(password, "someone")).isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining(reason);
    }

    @Test
    void rejectsPasswordsContainingTheUsername() {
        assertThatThrownBy(() -> PasswordPolicy.validate("kwame2026x", "kwame")).hasMessageContaining("username");
    }

    @Test
    void nullAndEmptyAreRejected() {
        assertThatThrownBy(() -> PasswordPolicy.validate(null, "u")).isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> PasswordPolicy.validate("", "u")).isInstanceOf(BusinessRuleViolationException.class);
    }
}
