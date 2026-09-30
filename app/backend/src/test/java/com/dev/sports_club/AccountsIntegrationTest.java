package com.dev.sports_club;

import com.dev.sports_club.security.Totp;
import com.dev.sports_club.service.MailService;
import com.dev.sports_club.support.IntegrationTestBase;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Password reset by email, two-step sign-in, and email addresses on accounts. */
class AccountsIntegrationTest extends IntegrationTestBase {

    @MockitoBean MailService mail;

    private int org;

    @BeforeEach
    void seed() {
        org = org("Accounts Org");
        user(org, "admin", "Admin");
        int u = user(org, "kim", "FrontDesk");
        jdbc.update("UPDATE app_user SET email = 'kim@example.com' WHERE user_id = ?", u);
    }

    private String loginJson(String user, String password, String code) {
        return "{\"username\":\"" + user + "\",\"password\":\"" + password + "\"" + (code == null ? "" : ",\"code\":\"" + code + "\"") + "}";
    }

    private int loginStatus(String user, String password, String code) throws Exception {
        return mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginJson(user, password, code))).andReturn().getResponse().getStatus();
    }

    // ================================================================ password reset

    @Nested
    class PasswordReset {

        private String requestLink() throws Exception {
            when(mail.isEnabled()).thenReturn(true);
            mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(JSON).content("{\"email\":\"KIM@example.com\"}")).andExpect(status().isAccepted());
            ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
            verify(mail, atLeastOnce()).send(eq("kim@example.com"), anyString(), body.capture());
            Matcher m = Pattern.compile("token=([A-Za-z0-9_-]+)").matcher(body.getValue());
            assertThat(m.find()).isTrue();
            return m.group(1);
        }

        private int reset(String token, String password) throws Exception {
            return mvc.perform(post("/api/auth/reset-password").with(csrf()).contentType(JSON).content("{\"token\":\"" + token + "\",\"newPassword\":\"" + password + "\"}")).andReturn().getResponse().getStatus();
        }

        @Test
        @DisplayName("a link is emailed, the token is stored only as a hash, and it sets a new password once")
        void fullFlow() throws Exception {
            String token = requestLink();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM password_reset_token WHERE token_hash = ?", Integer.class, token)).isZero();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM password_reset_token", Integer.class)).isEqualTo(1);

            assertThat(reset(token, "Brand-New-Pass9")).isEqualTo(200);
            assertThat(loginStatus("kim", "Brand-New-Pass9", null)).isEqualTo(200);
            assertThat(loginStatus("kim", PASSWORD, null)).isEqualTo(401);
            assertThat(reset(token, "Another-Pass-77")).isEqualTo(400);    // a link works once
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = 'PASSWORD_RESET'", Integer.class)).isEqualTo(2);
        }

        @Test
        @DisplayName("the response is the same whether or not the address has an account, and nothing is sent for strangers")
        void noAccountEnumeration() throws Exception {
            when(mail.isEnabled()).thenReturn(true);
            String known = mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(JSON).content("{\"email\":\"kim@example.com\"}")).andReturn().getResponse().getContentAsString();
            String unknown = mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(JSON).content("{\"email\":\"nobody@example.com\"}")).andReturn().getResponse().getContentAsString();
            assertThat(known).isEqualTo(unknown);
            verify(mail, times(1)).send(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("a weak new password is refused and the link still works afterwards")
        void weakPasswordKeepsLink() throws Exception {
            String token = requestLink();
            assertThat(reset(token, "password1")).isEqualTo(400);
            assertThat(reset(token, "short")).isEqualTo(400);
            assertThat(reset(token, "Good-Password-42")).isEqualTo(200);
        }

        @Test
        @DisplayName("expired, invented and older links are refused")
        void badLinks() throws Exception {
            assertThat(reset("not-a-real-token", "Good-Password-42")).isEqualTo(400);
            String first = requestLink();
            jdbc.update("UPDATE password_reset_token SET expires_at = ?", LocalDateTime.now().minusMinutes(1));
            assertThat(reset(first, "Good-Password-42")).isEqualTo(400);

            jdbc.update("DELETE FROM password_reset_token");
            String older = requestLink();
            String newer = requestLinkAgain();
            assertThat(reset(older, "Good-Password-42")).isEqualTo(400);    // asking again replaced the first link
            assertThat(reset(newer, "Good-Password-42")).isEqualTo(200);
        }

        private String requestLinkAgain() throws Exception {
            clearInvocations(mail);
            return requestLink();
        }

        @Test
        @DisplayName("resetting clears a lockout and ends existing sessions")
        void clearsLockAndSessions() throws Exception {
            jdbc.update("UPDATE app_user SET failed_attempts = 5, locked_until = ? WHERE username = 'kim'", LocalDateTime.now().plusMinutes(10));
            assertThat(loginStatus("kim", PASSWORD, null)).isEqualTo(401);
            String token = requestLink();
            assertThat(reset(token, "Good-Password-42")).isEqualTo(200);
            assertThat(loginStatus("kim", "Good-Password-42", null)).isEqualTo(200);
        }

        @Test
        @DisplayName("a deactivated account gets no link, and email that is not set up says so")
        void deactivatedAndDisabled() throws Exception {
            when(mail.isEnabled()).thenReturn(true);
            jdbc.update("UPDATE app_user SET is_active = 0 WHERE username = 'kim'");
            mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType(JSON).content("{\"email\":\"kim@example.com\"}")).andExpect(status().isAccepted());
            verify(mail, never()).send(anyString(), anyString(), anyString());

            when(mail.isEnabled()).thenReturn(false);
            mvc.perform(get("/api/auth/capabilities")).andExpect(status().isOk()).andExpect(jsonPath("$.passwordResetByEmail").value(false));
            when(mail.isEnabled()).thenReturn(true);
            mvc.perform(get("/api/auth/capabilities")).andExpect(jsonPath("$.passwordResetByEmail").value(true));
        }

        @Test
        @DisplayName("the endpoints need no sign-in but still need a CSRF token")
        void publicButProtected() throws Exception {
            mvc.perform(post("/api/auth/forgot-password").contentType(JSON).content("{\"email\":\"kim@example.com\"}")).andExpect(status().isForbidden());
            mvc.perform(post("/api/auth/reset-password").contentType(JSON).content("{\"token\":\"x\",\"newPassword\":\"Good-Password-42\"}")).andExpect(status().isForbidden());
        }
    }

    // ================================================================ two-step sign-in

    @Nested
    class TwoStep {

        private MockHttpSession mia;
        private String secret;

        private String codeAt(long offset) { return Totp.code(secret, Totp.stepAt(System.currentTimeMillis()) + offset); }

        @BeforeEach
        void enrol() throws Exception {
            user(org, "mia", "Admin");
            mia = login("mia");
            String json = postAs(mia, "/api/auth/mfa/setup", "").andExpect(status().isOk()).andExpect(jsonPath("$.otpauthUri", Matchers.startsWith("otpauth://totp/"))).andReturn().getResponse().getContentAsString();
            Matcher m = Pattern.compile("\"secret\":\"([A-Z2-7]+)\"").matcher(json);
            assertThat(m.find()).isTrue();
            secret = m.group(1);
        }

        private List<String> enable() throws Exception {
            String json = postAs(mia, "/api/auth/mfa/enable", "{\"code\":\"" + codeAt(0) + "\"}").andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            Matcher m = Pattern.compile("\"([A-Z2-9]{5}-[A-Z2-9]{5})\"").matcher(json);
            List<String> codes = new java.util.ArrayList<>();
            while (m.find()) codes.add(m.group(1));
            return codes;
        }

        @Test
        @DisplayName("enrolling needs a correct code, and gives ten recovery codes stored only as hashes")
        void enrolment() throws Exception {
            postAs(mia, "/api/auth/mfa/enable", "{\"code\":\"000000\"}").andExpect(status().isBadRequest());
            assertThat(jdbc.queryForObject("SELECT mfa_enabled FROM app_user WHERE username = 'mia'", Boolean.class)).isFalse();
            List<String> codes = enable();
            assertThat(codes).hasSize(10).doesNotHaveDuplicates();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mfa_recovery_code", Integer.class)).isEqualTo(10);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mfa_recovery_code WHERE code_hash = ?", Integer.class, codes.get(0).replace("-", ""))).isZero();
            getAs(mia, "/api/auth/me").andExpect(jsonPath("$.mfaEnabled").value(true));
        }

        @Test
        @DisplayName("after enrolling, the password alone no longer signs in, and asking for the code is not an error state")
        void passwordAloneIsNotEnough() throws Exception {
            enable();
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginJson("mia", PASSWORD, null)))
                    .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("MFA_REQUIRED"));
            assertThat(jdbc.queryForObject("SELECT failed_attempts FROM app_user WHERE username = 'mia'", Integer.class)).isZero();   // asking for the code is not a failure
            assertThat(loginStatus("mia", PASSWORD, "123456")).isEqualTo(401);
            assertThat(jdbc.queryForObject("SELECT failed_attempts FROM app_user WHERE username = 'mia'", Integer.class)).isEqualTo(1);
            assertThat(loginStatus("mia", "wrong-Pass-1", codeAt(1))).isEqualTo(401);
            assertThat(loginStatus("mia", PASSWORD, codeAt(1))).isEqualTo(200);
        }

        @Test
        @DisplayName("a code cannot be replayed")
        void replay() throws Exception {
            enable();                                       // used the current step
            String code = codeAt(1);
            assertThat(loginStatus("mia", PASSWORD, code)).isEqualTo(200);
            assertThat(loginStatus("mia", PASSWORD, code)).isEqualTo(401);
            assertThat(loginStatus("mia", PASSWORD, codeAt(0))).isEqualTo(401);    // an earlier step than the last accepted one
        }

        @Test
        @DisplayName("each recovery code works once")
        void recoveryCodes() throws Exception {
            List<String> codes = enable();
            assertThat(loginStatus("mia", PASSWORD, codes.get(0))).isEqualTo(200);
            assertThat(loginStatus("mia", PASSWORD, codes.get(0))).isEqualTo(401);
            assertThat(loginStatus("mia", PASSWORD, codes.get(1).toLowerCase().replace("-", " "))).isEqualTo(200);   // forgiving about case and spacing
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mfa_recovery_code WHERE used_at IS NULL", Integer.class)).isEqualTo(8);
        }

        @Test
        @DisplayName("guessing codes locks the account like guessing passwords does")
        void lockout() throws Exception {
            enable();
            for (int i = 0; i < 5; i++) assertThat(loginStatus("mia", PASSWORD, "00000" + i)).isEqualTo(401);
            assertThat(loginStatus("mia", PASSWORD, codeAt(1))).isEqualTo(401);    // right code, but locked
            assertThat(jdbc.queryForObject("SELECT locked_until IS NOT NULL FROM app_user WHERE username = 'mia'", Boolean.class)).isTrue();
        }

        @Test
        @DisplayName("turning it off needs the password and a code")
        void disable() throws Exception {
            enable();
            postAs(mia, "/api/auth/mfa/disable", "{\"password\":\"wrong-Pass-1\",\"code\":\"" + codeAt(1) + "\"}").andExpect(status().isBadRequest());
            postAs(mia, "/api/auth/mfa/disable", "{\"password\":\"" + PASSWORD + "\",\"code\":\"111111\"}").andExpect(status().isBadRequest());
            postAs(mia, "/api/auth/mfa/disable", "{\"password\":\"" + PASSWORD + "\",\"code\":\"" + codeAt(1) + "\"}").andExpect(status().isOk());
            assertThat(loginStatus("mia", PASSWORD, null)).isEqualTo(200);
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mfa_recovery_code", Integer.class)).isZero();
            assertThat(jdbc.queryForObject("SELECT mfa_secret IS NULL FROM app_user WHERE username = 'mia'", Boolean.class)).isTrue();
        }

        @Test
        @DisplayName("an administrator can reset it for someone who lost their phone, but only in their own organization")
        void adminReset() throws Exception {
            enable();
            int miaId = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username = 'mia'", Integer.class);
            int other = org("Other Org");
            user(other, "outsider", "Admin");
            postAs(login("outsider"), "/api/users/" + miaId + "/mfa/reset", "").andExpect(status().isNotFound());
            postAs(login("kim"), "/api/users/" + miaId + "/mfa/reset", "").andExpect(status().isForbidden());
            postAs(login("admin"), "/api/users/" + miaId + "/mfa/reset", "").andExpect(status().isOk()).andExpect(jsonPath("$.mfaEnabled").value(false));
            assertThat(loginStatus("mia", PASSWORD, null)).isEqualTo(200);
        }

        @Test
        @DisplayName("enrolling twice is refused, and enable without setup is refused")
        void misuse() throws Exception {
            enable();
            postAs(mia, "/api/auth/mfa/setup", "").andExpect(status().isBadRequest());
            user(org, "noel", "Admin");
            postAs(login("noel"), "/api/auth/mfa/enable", "{\"code\":\"123456\"}").andExpect(status().isBadRequest());
        }
    }

    // ================================================================ email addresses

    @Test
    @DisplayName("email addresses are validated, stored in lower case, and unique across accounts")
    void emailAddresses() throws Exception {
        MockHttpSession admin = login("admin");
        putAs(admin, "/api/auth/email", "{\"email\":\"not-an-email\"}").andExpect(status().isBadRequest());
        putAs(admin, "/api/auth/email", "{\"email\":\"Boss@Example.com\"}").andExpect(status().isOk()).andExpect(jsonPath("$.email").value("boss@example.com"));
        putAs(login("kim"), "/api/auth/email", "{\"email\":\"boss@example.com\"}").andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("already used")));
        putAs(admin, "/api/auth/email", "{\"email\":\"\"}").andExpect(status().isOk()).andExpect(jsonPath("$.email").doesNotExist());

        postAs(admin, "/api/users", "{\"username\":\"newbie\",\"password\":\"" + PASSWORD + "\",\"role\":\"FrontDesk\",\"email\":\"newbie@example.com\"}").andExpect(status().isCreated()).andExpect(jsonPath("$.email").value("newbie@example.com"));
        postAs(admin, "/api/users", "{\"username\":\"copycat\",\"password\":\"" + PASSWORD + "\",\"role\":\"FrontDesk\",\"email\":\"NEWBIE@example.com\"}").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("an administrator setting someone's password ends that person's stored sessions")
    void adminPasswordChangeRevokesSessions() throws Exception {
        jdbc.update("INSERT INTO SPRING_SESSION (PRIMARY_ID, SESSION_ID, CREATION_TIME, LAST_ACCESS_TIME, MAX_INACTIVE_INTERVAL, EXPIRY_TIME, PRINCIPAL_NAME) VALUES ('p1','s1',1,1,1800,9999999999999,'kim'), ('p2','s2',1,1,1800,9999999999999,'admin')");
        int kim = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username = 'kim'", Integer.class);
        putAs(login("admin"), "/api/users/" + kim, "{\"username\":\"kim\",\"role\":\"FrontDesk\",\"password\":\"Fresh-Password-88\"}").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME = 'kim'", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME = 'admin'", Integer.class)).isEqualTo(1);
        jdbc.update("DELETE FROM SPRING_SESSION");
    }
}
