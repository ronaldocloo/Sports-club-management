package com.dev.sports_club;

import com.dev.sports_club.demo.SuperAdminBootstrap;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DeploymentIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("the health endpoint is public and reports UP without leaking details")
    void health() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP")).andExpect(jsonPath("$.components").doesNotExist());
        mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("no other actuator endpoint is reachable")
    void nothingElseExposed() throws Exception {
        for (String p : new String[]{"/actuator/env", "/actuator/beans", "/actuator/heapdump", "/actuator/mappings", "/actuator/metrics"}) {
            assertThat(statusOf(mvc.perform(get(p)))).as(p).isIn(401, 403, 404);
        }
    }

    @Test
    @DisplayName("bootstrap creates the first Super Admin once, who can then sign in")
    void bootstrapCreates() throws Exception {
        String pw = "Str0ng-Bootstrap-pw";
        new SuperAdminBootstrap(jdbc, encoder, "platform.owner", pw).run(null);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE role='SuperAdmin' AND organization_id IS NULL", Integer.class)).isEqualTo(1);
        getAs(login("platform.owner", pw), "/api/auth/me").andExpect(jsonPath("$.role").value("SuperAdmin"));
        // a second run, even with another password, changes nothing
        new SuperAdminBootstrap(jdbc, encoder, "someone.else", "An0ther-Str0ng-pw").run(null);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE role='SuperAdmin'", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("bootstrap does nothing without a password, and refuses a weak one")
    void bootstrapGuards() {
        new SuperAdminBootstrap(jdbc, encoder, "superadmin", "").run(null);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user", Integer.class)).isZero();
        assertThatThrownBy(() -> new SuperAdminBootstrap(jdbc, encoder, "superadmin", "password1").run(null)).isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> new SuperAdminBootstrap(jdbc, encoder, "superadmin", "short").run(null)).isInstanceOf(BusinessRuleViolationException.class);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user", Integer.class)).isZero();
    }
}
