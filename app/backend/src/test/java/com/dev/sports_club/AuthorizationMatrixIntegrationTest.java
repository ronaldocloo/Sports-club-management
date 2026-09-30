package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockHttpSession;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Every role against a spread of endpoints: is the request allowed through (not 401/403) or refused (403)?
 * The response body may still be 400/404 for an empty request: what matters is who gets past authorization.
 */
class AuthorizationMatrixIntegrationTest extends IntegrationTestBase {

    private final Map<String, MockHttpSession> sessions = new HashMap<>();

    @BeforeEach
    void seed() {
        int org = org("Matrix Org");
        int sport = sport(org, "Football");
        int coachId = coach(org, "Co", "Ach");
        int team = team(org, "Matrix FC", sport, coachId);
        int athleteId = athlete(org, "Ath", "Lete");
        roster(org, team, athleteId, true);
        user(org, "admin", "Admin");
        user(org, "desk", "FrontDesk");
        user(org, "coach", "Coach", coachId, null);
        user(org, "athlete", "Athlete", null, athleteId);
        for (String u : new String[]{"admin", "desk", "coach", "athlete"}) sessions.put(u, login(u));
    }

    /** role, method, url, forbidden? */
    static Stream<Arguments> matrix() {
        String[][] rows = {
                // reads
                {"admin", "GET", "/api/athletes", "false"}, {"desk", "GET", "/api/athletes", "false"}, {"coach", "GET", "/api/athletes", "false"}, {"athlete", "GET", "/api/athletes", "false"},
                {"admin", "GET", "/api/teams", "false"}, {"desk", "GET", "/api/teams", "true"}, {"coach", "GET", "/api/teams", "false"}, {"athlete", "GET", "/api/teams", "false"},
                {"admin", "GET", "/api/coaches", "false"}, {"desk", "GET", "/api/coaches", "true"}, {"coach", "GET", "/api/coaches", "false"},
                {"admin", "GET", "/api/memberships", "false"}, {"desk", "GET", "/api/memberships", "false"}, {"coach", "GET", "/api/memberships", "true"}, {"athlete", "GET", "/api/memberships", "false"},
                {"admin", "GET", "/api/payments", "false"}, {"desk", "GET", "/api/payments", "false"}, {"coach", "GET", "/api/payments", "true"}, {"athlete", "GET", "/api/payments", "false"},
                {"admin", "GET", "/api/facilities", "false"}, {"desk", "GET", "/api/facilities", "false"}, {"coach", "GET", "/api/facilities", "false"}, {"athlete", "GET", "/api/facilities", "false"},
                {"admin", "GET", "/api/competitions", "false"}, {"coach", "GET", "/api/competitions", "false"}, {"athlete", "GET", "/api/competitions", "false"},
                // writes
                {"admin", "POST", "/api/athletes", "false"}, {"desk", "POST", "/api/athletes", "false"}, {"coach", "POST", "/api/athletes", "true"}, {"athlete", "POST", "/api/athletes", "true"},
                {"admin", "POST", "/api/teams", "false"}, {"desk", "POST", "/api/teams", "true"}, {"coach", "POST", "/api/teams", "true"}, {"athlete", "POST", "/api/teams", "true"},
                {"admin", "POST", "/api/payments", "false"}, {"desk", "POST", "/api/payments", "false"}, {"coach", "POST", "/api/payments", "true"}, {"athlete", "POST", "/api/payments", "true"},
                {"admin", "PUT", "/api/payments/1", "false"}, {"desk", "PUT", "/api/payments/1", "true"},
                {"admin", "POST", "/api/competitions", "false"}, {"desk", "POST", "/api/competitions", "true"}, {"coach", "POST", "/api/competitions", "true"},
                {"admin", "POST", "/api/facilities", "false"}, {"desk", "POST", "/api/facilities", "true"},
                {"admin", "POST", "/api/events", "false"}, {"coach", "POST", "/api/events", "true"}, {"athlete", "POST", "/api/events", "true"},
                {"admin", "DELETE", "/api/athletes/1", "false"}, {"desk", "DELETE", "/api/athletes/1", "true"},
                // users, organization, audit
                {"admin", "GET", "/api/users", "false"}, {"desk", "GET", "/api/users", "true"}, {"coach", "GET", "/api/users", "true"}, {"athlete", "GET", "/api/users", "true"},
                {"admin", "GET", "/api/audit-logs", "false"}, {"desk", "GET", "/api/audit-logs", "true"}, {"coach", "GET", "/api/audit-logs", "true"},
                {"admin", "GET", "/api/organizations", "true"}, {"desk", "GET", "/api/organizations", "true"},
                // training, attendance, performance, fixtures
                {"admin", "GET", "/api/training-sessions", "false"}, {"coach", "GET", "/api/training-sessions", "false"}, {"desk", "GET", "/api/training-sessions", "true"}, {"athlete", "GET", "/api/training-sessions", "true"},
                {"admin", "GET", "/api/attendance/athletes", "false"}, {"coach", "GET", "/api/attendance/athletes", "false"}, {"athlete", "GET", "/api/attendance/athletes", "false"}, {"desk", "GET", "/api/attendance/athletes", "true"},
                {"admin", "POST", "/api/performance", "false"}, {"coach", "POST", "/api/performance", "false"}, {"desk", "POST", "/api/performance", "true"}, {"athlete", "POST", "/api/performance", "true"},
                {"admin", "GET", "/api/fixtures", "false"}, {"athlete", "GET", "/api/fixtures", "false"},
                {"admin", "POST", "/api/fixtures", "false"}, {"coach", "POST", "/api/fixtures", "true"}, {"desk", "POST", "/api/fixtures", "true"},
                {"admin", "PUT", "/api/fixtures/1/result", "false"}, {"coach", "PUT", "/api/fixtures/1/result", "false"}, {"desk", "PUT", "/api/fixtures/1/result", "true"}, {"athlete", "PUT", "/api/fixtures/1/result", "true"},
                // analytics, reports, intelligence, jobs
                {"admin", "GET", "/api/analytics/overview", "false"}, {"desk", "GET", "/api/analytics/overview", "true"}, {"coach", "GET", "/api/analytics/overview", "true"}, {"athlete", "GET", "/api/analytics/overview", "true"},
                {"admin", "GET", "/api/reports/financial", "false"}, {"desk", "GET", "/api/reports/financial", "false"}, {"coach", "GET", "/api/reports/financial", "true"}, {"athlete", "GET", "/api/reports/financial", "true"},
                {"coach", "GET", "/api/reports/attendance", "false"}, {"desk", "GET", "/api/reports/attendance", "true"},
                {"admin", "GET", "/api/reports/facilities", "false"}, {"desk", "GET", "/api/reports/facilities", "true"}, {"coach", "GET", "/api/reports/facilities", "true"},
                {"admin", "GET", "/api/intelligence/retention", "false"}, {"desk", "GET", "/api/intelligence/retention", "false"}, {"coach", "GET", "/api/intelligence/retention", "true"}, {"athlete", "GET", "/api/intelligence/retention", "true"},
                {"admin", "GET", "/api/intelligence/revenue-forecast", "false"}, {"desk", "GET", "/api/intelligence/revenue-forecast", "true"},
                {"admin", "GET", "/api/intelligence/anomalies", "false"}, {"desk", "GET", "/api/intelligence/anomalies", "false"}, {"coach", "GET", "/api/intelligence/anomalies", "true"},
                {"admin", "POST", "/api/admin/jobs/run", "false"}, {"desk", "POST", "/api/admin/jobs/run", "true"}, {"coach", "POST", "/api/admin/jobs/run", "true"},
                // accounts: anyone signed in manages their own email and two-step sign-in; only an Admin resets someone else's
                {"admin", "PUT", "/api/auth/email", "false"}, {"desk", "PUT", "/api/auth/email", "false"}, {"coach", "PUT", "/api/auth/email", "false"}, {"athlete", "PUT", "/api/auth/email", "false"},
                {"admin", "POST", "/api/auth/mfa/setup", "false"}, {"desk", "POST", "/api/auth/mfa/setup", "false"}, {"coach", "POST", "/api/auth/mfa/setup", "false"}, {"athlete", "POST", "/api/auth/mfa/setup", "false"},
                {"admin", "POST", "/api/users/999/mfa/reset", "false"}, {"desk", "POST", "/api/users/999/mfa/reset", "true"}, {"coach", "POST", "/api/users/999/mfa/reset", "true"}, {"athlete", "POST", "/api/users/999/mfa/reset", "true"},
                // notifications: everyone signed in
                {"admin", "GET", "/api/notifications", "false"}, {"desk", "GET", "/api/notifications", "false"}, {"coach", "GET", "/api/notifications", "false"}, {"athlete", "GET", "/api/notifications", "false"},
        };
        return Stream.of(rows).map(r -> Arguments.of(r[0], r[1], r[2], Boolean.parseBoolean(r[3])));
    }

    @ParameterizedTest(name = "{0} {1} {2} -> {3}")
    @MethodSource("matrix")
    void roleCanOrCannot(String role, String method, String url, boolean forbidden) {
        MockHttpSession session = sessions.get(role);
        String body = "{}";
        int status = switch (method) {
            case "GET" -> statusOf(getAs(session, url));
            case "POST" -> statusOf(postAs(session, url, body));
            case "PUT" -> statusOf(putAs(session, url, body));
            default -> statusOf(deleteAs(session, url));
        };
        if (forbidden) assertThat(status).as("%s %s as %s should be refused", method, url, role).isEqualTo(403);
        else assertThat(status).as("%s %s as %s should get past authorization", method, url, role).isNotIn(401, 403);
    }
}
