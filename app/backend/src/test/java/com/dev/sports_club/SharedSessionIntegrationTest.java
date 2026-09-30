package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Sessions are stored in the database, so any API instance can serve any signed-in user and a restart keeps
 * people signed in. This uses real cookies (not MockHttpSession) and turns database sessions back on.
 */
@TestPropertySource(properties = "spring.autoconfigure.exclude=")
class SharedSessionIntegrationTest extends IntegrationTestBase {

    private Cookie session;

    @BeforeEach
    void signIn() throws Exception {
        jdbc.execute("DELETE FROM SPRING_SESSION");
        int org = org("Session Org");
        user(org, "sam", "Admin");
        var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content("{\"username\":\"sam\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk()).andReturn();
        session = result.getResponse().getCookie("SESSION");
        assertThat(session).as("session cookie").isNotNull();
        assertThat(result.getResponse().getHeaders("Set-Cookie").stream().filter(h -> h.startsWith("SESSION=")).findFirst().orElse(""))
                .contains("HttpOnly").contains("SameSite=Lax");
    }

    @Test
    @DisplayName("the session is held in the database and the cookie alone is enough to use it")
    void storedInDatabase() throws Exception {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION_ATTRIBUTES", Integer.class)).isPositive();
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isOk());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("signing out deletes the stored session, so the cookie stops working")
    void logoutRemovesIt() throws Exception {
        mvc.perform(post("/api/auth/logout").cookie(session).with(csrf())).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION", Integer.class)).isZero();
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("an idle session that has passed its expiry is refused")
    void expiredSession() throws Exception {
        long twoHoursAgo = System.currentTimeMillis() - 2 * 3600_000L;   // idle timeout is 30 minutes
        jdbc.update("UPDATE SPRING_SESSION SET LAST_ACCESS_TIME = ?, EXPIRY_TIME = ?", twoHoursAgo, twoHoursAgo + 1800_000L);
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("deactivating the account ends access immediately even though the session is stored")
    void deactivatedAccount() throws Exception {
        jdbc.update("UPDATE app_user SET is_active = 0 WHERE username = 'sam'");
        mvc.perform(get("/api/auth/me").cookie(session)).andExpect(status().isUnauthorized());
    }
}
