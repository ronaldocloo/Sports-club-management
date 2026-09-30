package com.dev.sports_club.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;

/**
 * Time-based one-time passwords (RFC 6238) as used by Google Authenticator, Microsoft Authenticator, 1Password
 * and others: HMAC-SHA1, 30-second steps, 6 digits, secret shown to the user as base32.
 */
public final class Totp {

    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    public static final int STEP_SECONDS = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private Totp() { }

    /** A new random 160-bit secret, base32 encoded. */
    public static String newSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32(bytes);
    }

    /** The six digits for a given time step. */
    public static String code(String secret, long step) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(decode(secret), "HmacSHA1"));
            byte[] msg = new byte[8];
            for (int i = 7, s = 0; i >= 0; i--, s += 8) msg[i] = (byte) (step >>> s);
            byte[] hash = mac.doFinal(msg);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
            return String.format("%06d", binary % 1_000_000);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA1 is not available", e);
        }
    }

    public static long stepAt(long epochMillis) {
        return epochMillis / 1000 / STEP_SECONDS;
    }

    /**
     * Checks a code against the current step and one either side (phones are rarely exactly in sync). Returns the
     * step that matched, or -1. A step at or before {@code lastAcceptedStep} is refused, so a code cannot be reused.
     */
    public static long verify(String secret, String submitted, long nowMillis, Long lastAcceptedStep) {
        if (secret == null || submitted == null) return -1;
        String digits = submitted.replaceAll("\\s", "");
        if (!digits.matches("\\d{6}")) return -1;
        long now = stepAt(nowMillis);
        long matched = -1;
        for (long step = now - 1; step <= now + 1; step++) {
            boolean equal = MessageDigest.isEqual(code(secret, step).getBytes(StandardCharsets.UTF_8), digits.getBytes(StandardCharsets.UTF_8));
            if (equal && (lastAcceptedStep == null || step > lastAcceptedStep)) matched = step;
        }
        return matched;
    }

    /** The otpauth:// address that authenticator apps read from a QR code. */
    public static String uri(String issuer, String account, String secret) {
        String label = enc(issuer) + ":" + enc(account);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + enc(issuer) + "&algorithm=SHA1&digits=6&period=" + STEP_SECONDS;
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public static String base32(byte[] data) {
        StringBuilder out = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) { out.append(ALPHABET.charAt((buffer >> (bits - 5)) & 31)); bits -= 5; }
        }
        if (bits > 0) out.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        return out.toString();
    }

    public static byte[] decode(String text) {
        String s = text.replace("=", "").replace(" ", "").toUpperCase();
        byte[] out = new byte[s.length() * 5 / 8];
        int buffer = 0, bits = 0, index = 0;
        for (char c : s.toCharArray()) {
            int v = ALPHABET.indexOf(c);
            if (v < 0) throw new IllegalArgumentException("Not a base32 character: " + c);
            buffer = (buffer << 5) | v;
            bits += 5;
            if (bits >= 8) { out[index++] = (byte) (buffer >> (bits - 8)); bits -= 8; }
        }
        return out;
    }
}
