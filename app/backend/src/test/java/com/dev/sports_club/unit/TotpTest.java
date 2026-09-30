package com.dev.sports_club.unit;

import com.dev.sports_club.security.Totp;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TotpTest {

    // RFC 6238 appendix B: the shared secret is the ASCII string "12345678901234567890".
    private static final String RFC_SECRET = Totp.base32("12345678901234567890".getBytes(StandardCharsets.US_ASCII));

    @Test
    void matchesTheRfc6238TestVectors() {
        // The RFC lists 8-digit codes; the 6-digit code is the last six digits of each.
        assertThat(Totp.code(RFC_SECRET, 59L / 30)).isEqualTo("287082");            // 94287082
        assertThat(Totp.code(RFC_SECRET, 1111111109L / 30)).isEqualTo("081804");    // 07081804
        assertThat(Totp.code(RFC_SECRET, 1111111111L / 30)).isEqualTo("050471");    // 14050471
        assertThat(Totp.code(RFC_SECRET, 1234567890L / 30)).isEqualTo("005924");    // 89005924
        assertThat(Totp.code(RFC_SECRET, 2000000000L / 30)).isEqualTo("279037");    // 69279037
    }

    @Test
    void base32RoundTripsAndKnownValue() {
        assertThat(RFC_SECRET).isEqualTo("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        byte[] random = new byte[20];
        new java.security.SecureRandom().nextBytes(random);
        assertThat(Totp.decode(Totp.base32(random))).isEqualTo(random);
        assertThat(Totp.newSecret()).matches("[A-Z2-7]{32}");
        assertThatThrownBy(() -> Totp.decode("not-base32!")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void acceptsThePreviousCurrentAndNextStepButNothingFurther() {
        long now = 1_700_000_000_000L;
        long step = Totp.stepAt(now);
        for (long s = step - 1; s <= step + 1; s++) assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, s), now, null)).isEqualTo(s);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step - 2), now, null)).isEqualTo(-1);
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step + 2), now, null)).isEqualTo(-1);
    }

    @Test
    void aCodeCannotBeUsedTwice() {
        long now = 1_700_000_000_000L;
        long step = Totp.stepAt(now);
        String code = Totp.code(RFC_SECRET, step);
        assertThat(Totp.verify(RFC_SECRET, code, now, null)).isEqualTo(step);
        assertThat(Totp.verify(RFC_SECRET, code, now, step)).isEqualTo(-1);          // same step again: refused
        assertThat(Totp.verify(RFC_SECRET, Totp.code(RFC_SECRET, step + 1), now, step)).isEqualTo(step + 1);
    }

    @Test
    void rejectsMalformedInput() {
        long now = 1_700_000_000_000L;
        for (String bad : new String[]{"", "12345", "1234567", "abcdef", "12 34", null}) assertThat(Totp.verify(RFC_SECRET, bad, now, null)).isEqualTo(-1);
        assertThat(Totp.verify(null, "123456", now, null)).isEqualTo(-1);
    }

    @Test
    void spacesInsideACodeAreIgnored() {
        long now = 1_700_000_000_000L;
        String code = Totp.code(RFC_SECRET, Totp.stepAt(now));
        assertThat(Totp.verify(RFC_SECRET, code.substring(0, 3) + " " + code.substring(3), now, null)).isGreaterThanOrEqualTo(0);
    }

    @Test
    void buildsAnAuthenticatorUri() {
        String uri = Totp.uri("Sports Club Platform", "ama.mensah", "ABCDEFGH");
        assertThat(uri).startsWith("otpauth://totp/Sports%20Club%20Platform:ama.mensah?secret=ABCDEFGH")
                .contains("issuer=Sports%20Club%20Platform").contains("digits=6").contains("period=30");
    }
}
