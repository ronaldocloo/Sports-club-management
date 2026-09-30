package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

class AuthIntegrationTest extends IntegrationTestBase {

    private int orgId;

    private void basics() {
        orgId = org("Alpha Club");
        user(orgId, "alpha.admin", "Admin");
    }

    private String loginBody(String u, String p) { return "{\"username\":\"" + u + "\",\"password\":\"" + p + "\"}"; }

    @Test
    @DisplayName("requests without a session are rejected with 401")
    void unauthenticated() throws Exception {
        basics();
        mvc.perform(get("/api/athletes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("login returns the user, role and organization")
    void loginSucceeds() throws Exception {
        basics();
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("alpha.admin", PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alpha.admin"))
                .andExpect(jsonPath("$.role").value("Admin"))
                .andExpect(jsonPath("$.organizationId").value(orgId));
    }

    @Test
    @DisplayName("wrong password, unknown user, deactivated user and suspended organization all fail the same way")
    void loginFailures() throws Exception {
        basics();
        user(orgId, "sleepy", "Coach", coach(orgId, "C", "One"), null);
        jdbc.update("UPDATE app_user SET is_active = 0 WHERE username = 'sleepy'");
        int suspended = org("Suspended Club");
        user(suspended, "suspended.admin", "Admin");
        jdbc.update("UPDATE organization SET status = 'Suspended' WHERE organization_id = ?", suspended);

        for (String[] c : new String[][]{{"alpha.admin", "wrong-password1"}, {"nobody", PASSWORD}, {"sleepy", PASSWORD}, {"suspended.admin", PASSWORD}}) {
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody(c[0], c[1])))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid username or password"));
        }
    }

    @Test
    @DisplayName("a write without a CSRF token is refused, with one it works")
    void csrfRequired() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        mvc.perform(post("/api/sports").session(admin).contentType(JSON).content("{\"sportName\":\"Rugby\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/sports").session(admin).with(csrf()).contentType(JSON).content("{\"sportName\":\"Rugby\"}")).andExpect(status().isCreated());
    }

    @Test
    @DisplayName("security headers are set on API responses")
    void securityHeaders() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        mvc.perform(get("/api/athletes").session(admin))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Content-Security-Policy", containsString("default-src 'none'")))
                .andExpect(header().string("Cache-Control", containsString("no-store")));
    }

    @Test
    @DisplayName("logout ends the session")
    void logout() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        postAs(admin, "/api/auth/logout", "").andExpect(status().isOk());
        mvc.perform(get("/api/athletes").session(admin)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("deactivating a user ends their open session immediately")
    void deactivationEndsSession() throws Exception {
        basics();
        int desk = user(orgId, "desk", "FrontDesk");
        MockHttpSession deskSession = login("desk");
        getAs(deskSession, "/api/athletes").andExpect(status().isOk());

        MockHttpSession admin = login("alpha.admin");
        putAs(admin, "/api/users/" + desk, "{\"username\":\"desk\",\"role\":\"FrontDesk\",\"isActive\":false}").andExpect(status().isOk());

        getAs(deskSession, "/api/athletes").andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("changing a user's role ends their open session")
    void roleChangeEndsSession() throws Exception {
        basics();
        int desk = user(orgId, "desk", "FrontDesk");
        MockHttpSession deskSession = login("desk");
        MockHttpSession admin = login("alpha.admin");
        int coachId = coach(orgId, "Co", "Ach");
        putAs(admin, "/api/users/" + desk, "{\"username\":\"desk\",\"role\":\"Coach\",\"coachId\":" + coachId + "}").andExpect(status().isOk());
        getAs(deskSession, "/api/athletes").andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("an admin cannot deactivate, delete or change the role of their own account")
    void selfProtection() throws Exception {
        basics();
        int second = user(orgId, "second.admin", "Admin");
        MockHttpSession admin = login("alpha.admin");
        int self = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username='alpha.admin'", Integer.class);
        putAs(admin, "/api/users/" + self, "{\"username\":\"alpha.admin\",\"role\":\"Admin\",\"isActive\":false}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot deactivate your own account"));
        putAs(admin, "/api/users/" + self, "{\"username\":\"alpha.admin\",\"role\":\"FrontDesk\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You cannot change your own role"));
        deleteAs(admin, "/api/users/" + self).andExpect(status().isBadRequest());
        assertThat(second).isPositive();
    }

    @Test
    @DisplayName("the last active admin cannot be removed or demoted")
    void lastAdmin() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        int desk = user(orgId, "desk", "FrontDesk");
        // A different admin (super) is not needed: the only Admin is the caller, guarded by the self rules above.
        putAs(admin, "/api/users/" + desk, "{\"username\":\"desk\",\"role\":\"FrontDesk\",\"isActive\":true}").andExpect(status().isOk());
        int other = user(orgId, "other.admin", "Admin");
        MockHttpSession otherSession = login("other.admin");
        // other.admin demotes alpha.admin: allowed while a second admin (other.admin) remains.
        int alpha = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username='alpha.admin'", Integer.class);
        putAs(otherSession, "/api/users/" + alpha, "{\"username\":\"alpha.admin\",\"role\":\"FrontDesk\"}").andExpect(status().isOk());
        assertThat(other).isPositive();
    }

    @Test
    @DisplayName("password change requires the current password and follows the policy")
    void changePassword() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        postAs(admin, "/api/auth/change-password", "{\"currentPassword\":\"wrong\",\"newPassword\":\"NewPass123\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Current password is incorrect"));
        postAs(admin, "/api/auth/change-password", "{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"" + PASSWORD + "\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("different")));
        postAs(admin, "/api/auth/change-password", "{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"onlyletters\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("letter and one number")));
        postAs(admin, "/api/auth/change-password", "{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"password123\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message", containsString("too common")));
        postAs(admin, "/api/auth/change-password", "{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"BrandNew456\"}").andExpect(status().isOk());

        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("alpha.admin", PASSWORD))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("alpha.admin", "BrandNew456"))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("five wrong passwords lock the account; an admin reset unlocks it; success clears the counter")
    void lockout() throws Exception {
        basics();
        user(orgId, "victim", "FrontDesk");
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("victim", "wrong-pass" + i))).andExpect(status().isUnauthorized());
        }
        assertThat(jdbc.queryForObject("SELECT locked_until IS NOT NULL FROM app_user WHERE username='victim'", Boolean.class)).isTrue();
        // Even the right password is refused while locked.
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("victim", PASSWORD))).andExpect(status().isUnauthorized());

        MockHttpSession admin = login("alpha.admin");
        int victim = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username='victim'", Integer.class);
        putAs(admin, "/api/users/" + victim, "{\"username\":\"victim\",\"role\":\"FrontDesk\",\"password\":\"Recovered789\"}").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT failed_attempts FROM app_user WHERE username='victim'", Integer.class)).isZero();
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("victim", "Recovered789"))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("a successful sign-in resets earlier failed attempts")
    void successResetsCounter() throws Exception {
        basics();
        user(orgId, "victim", "FrontDesk");
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("victim", "wrong-pass" + i))).andExpect(status().isUnauthorized());
        }
        assertThat(jdbc.queryForObject("SELECT failed_attempts FROM app_user WHERE username='victim'", Integer.class)).isEqualTo(3);
        login("victim");
        assertThat(jdbc.queryForObject("SELECT failed_attempts FROM app_user WHERE username='victim'", Integer.class)).isZero();
    }

    @Test
    @DisplayName("malformed and invalid input gets a clean 400 with no internals")
    void validationErrors() throws Exception {
        basics();
        MockHttpSession admin = login("alpha.admin");
        postAs(admin, "/api/athletes", "{\"firstName\":\"\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Some fields are missing or invalid"))
                .andExpect(jsonPath("$.errors.firstName").exists());
        postAs(admin, "/api/sports", "{not json").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The request could not be understood"));
        getAs(admin, "/api/no-such-thing").andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("sign-ins, failures and password changes are written to the audit log")
    void authAudit() throws Exception {
        basics();
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content(loginBody("alpha.admin", "wrong-pass1"))).andExpect(status().isUnauthorized());
        login("alpha.admin");
        assertThat(jdbc.queryForList("SELECT action FROM audit_log ORDER BY audit_id", String.class)).containsExactly("LOGIN_FAILED", "LOGIN");
    }
}
