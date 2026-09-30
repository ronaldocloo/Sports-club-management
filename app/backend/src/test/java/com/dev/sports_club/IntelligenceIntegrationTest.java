package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class IntelligenceIntegrationTest extends IntegrationTestBase {

    private int org, atRisk, safe, ownAthlete, otherAthlete, type, membershipSafe;
    private MockHttpSession admin;
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void seed() {
        org = org("Intel Org");
        int sport = sport(org, "Football");
        int coach = coach(org, "Own", "Coach");
        int otherCoach = coach(org, "Other", "Coach");
        int team = team(org, "Alpha FC", sport, coach);
        int otherTeam = team(org, "Beta FC", sport, otherCoach);
        type = membershipType(org, "Monthly", 100, 1);
        atRisk = athlete(org, "Risky", "Person");        // membership ended 20 days ago
        membership(org, atRisk, type, today.minusDays(50), today.minusDays(20), 100, "Expired");
        athlete(org, "Just", "Visiting");                // never a member and on no team: not scored
        safe = athlete(org, "Safe", "Person");           // membership running for months
        membershipSafe = membership(org, safe, type, today.minusDays(10), today.plusDays(200), 500, "Active");
        ownAthlete = safe;
        otherAthlete = athlete(org, "Other", "Person");
        membership(org, otherAthlete, type, today.minusDays(5), today.plusDays(200), 100, "Active");
        roster(org, team, ownAthlete, true);
        roster(org, otherTeam, otherAthlete, true);
        user(org, "admin", "Admin");
        user(org, "desk", "FrontDesk");
        user(org, "coach", "Coach", coach, null);
        user(org, "risky.acct", "Athlete", null, atRisk);
        user(org, "safe.acct", "Athlete", null, safe);
        admin = login("admin");
    }

    @Test
    @DisplayName("retention ranks the athlete whose membership ended above the one with a long one, with reasons")
    void retentionOrder() throws Exception {
        getAs(admin, "/api/intelligence/retention").andExpect(status().isOk())
                .andExpect(jsonPath("$.athletes[0].name").value("Risky Person"))
                .andExpect(jsonPath("$.athletes[0].factors[0].points").value(40))
                .andExpect(jsonPath("$.athletes[0].hasAccount").value(true))
                .andExpect(jsonPath("$.athletes[0].action", not(emptyString())))
                .andExpect(jsonPath("$.athletes", hasSize(1)));   // only athletes scoring 20+ are listed
        String counts = getAs(admin, "/api/intelligence/retention").andReturn().getResponse().getContentAsString();
        int total = 0;
        for (String k : new String[]{"high", "medium", "low"}) total += Integer.parseInt(counts.replaceAll(".*\"" + k + "\":(\\d+).*", "$1"));
        assertThat(total).isEqualTo(3);                        // but every scored athlete is counted
    }

    @Test
    @DisplayName("nudging sends one notification to the athlete's account, and refuses when there is no account")
    void nudge() throws Exception {
        assertThat(statusOf(postAs(admin, "/api/intelligence/retention/" + atRisk + "/nudge", ""))).isBetween(200, 204);
        int notified = jdbc.queryForObject("SELECT COUNT(*) FROM notification n JOIN app_user u ON u.user_id = n.user_id WHERE u.username = 'risky.acct'", Integer.class);
        assertThat(notified).isEqualTo(1);
        postAs(admin, "/api/intelligence/retention/" + atRisk + "/nudge", "");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM notification n JOIN app_user u ON u.user_id = n.user_id WHERE u.username = 'risky.acct'", Integer.class)).isEqualTo(1); // same day: not repeated
        postAs(admin, "/api/intelligence/retention/" + otherAthlete + "/nudge", "").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("no user account")));
    }

    @Test
    @DisplayName("a perfectly linear revenue history forecasts the next months exactly, with no band")
    void forecast() throws Exception {
        YearMonth last = YearMonth.from(today).minusMonths(1);
        for (int i = 0; i < 6; i++) {
            YearMonth m = last.minusMonths(5 - i);
            payment(org, membershipSafe, 100.0 * (i + 1), "Completed", m.atDay(10));
        }
        getAs(admin, "/api/intelligence/revenue-forecast").andExpect(status().isOk())
                .andExpect(jsonPath("$.history", hasSize(6)))
                .andExpect(jsonPath("$.forecast", hasSize(3)))
                .andExpect(jsonPath("$.forecast[0].month").value(YearMonth.from(today).toString()))
                .andExpect(jsonPath("$.forecast[0].expected").value(closeTo(700, 0.5)))
                .andExpect(jsonPath("$.forecast[2].expected").value(closeTo(900, 0.5)))
                .andExpect(jsonPath("$.forecast[0].low").value(closeTo(700, 0.5)))
                .andExpect(jsonPath("$.forecast[0].high").value(closeTo(700, 0.5)))
                .andExpect(jsonPath("$.monthlyChange").value(closeTo(100, 0.5)));
    }

    @Test
    @DisplayName("with too little history the forecast says so instead of guessing")
    void forecastNeedsHistory() throws Exception {
        payment(org, membershipSafe, 100, "Completed", YearMonth.from(today).minusMonths(1).atDay(3));
        getAs(admin, "/api/intelligence/revenue-forecast").andExpect(status().isOk()).andExpect(jsonPath("$.forecast", hasSize(0)));
    }

    @Test
    @DisplayName("payment anomalies: duplicates, repeated failures and stale pending payments are flagged")
    void anomalies() throws Exception {
        payment(org, membershipSafe, 40, "Completed", today.minusDays(3));
        payment(org, membershipSafe, 40, "Completed", today.minusDays(3));
        payment(org, membershipSafe, 25, "Failed", today.minusDays(4));
        payment(org, membershipSafe, 25, "Failed", today.minusDays(2));
        payment(org, membershipSafe, 15, "Pending", today.minusDays(30));
        getAs(admin, "/api/intelligence/anomalies").andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type=='Possible duplicate')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='Repeated failures')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='Stale pending payment')]", hasSize(1)));
    }

    @Test
    @DisplayName("clean data raises no anomalies")
    void noAnomalies() throws Exception {
        payment(org, membershipSafe, 100, "Completed", today.minusDays(3));
        getAs(admin, "/api/intelligence/anomalies").andExpect(jsonPath("$", hasSize(0)));
    }

    @ParameterizedTest(name = "{0} GET {1} -> {2}")
    @CsvSource({
            "admin,/api/intelligence/retention,200", "desk,/api/intelligence/retention,200", "coach,/api/intelligence/retention,403",
            "admin,/api/intelligence/anomalies,200", "desk,/api/intelligence/anomalies,200", "coach,/api/intelligence/anomalies,403",
            "admin,/api/intelligence/revenue-forecast,200", "desk,/api/intelligence/revenue-forecast,403", "coach,/api/intelligence/revenue-forecast,403",
            "admin,/api/intelligence/facility-demand,200", "desk,/api/intelligence/facility-demand,403",
            "admin,/api/intelligence/attendance-outlook,200", "coach,/api/intelligence/attendance-outlook,403"
    })
    void roles(String user, String url, int expected) throws Exception {
        assertThat(statusOf(getAs(login(user), url))).isEqualTo(expected);
    }

    @Test
    @DisplayName("athlete insight: an athlete sees only their own, a coach only their team's, an admin any")
    void insightScoping() throws Exception {
        getAs(login("safe.acct"), "/api/intelligence/athletes/" + safe).andExpect(status().isOk());
        assertThat(statusOf(getAs(login("safe.acct"), "/api/intelligence/athletes/" + otherAthlete))).isIn(403, 404);
        getAs(login("coach"), "/api/intelligence/athletes/" + ownAthlete).andExpect(status().isOk());
        assertThat(statusOf(getAs(login("coach"), "/api/intelligence/athletes/" + otherAthlete))).isIn(403, 404);
        getAs(admin, "/api/intelligence/athletes/" + otherAthlete).andExpect(status().isOk());
    }

    @Test
    @DisplayName("another organization's data never influences this one's intelligence")
    void isolation() throws Exception {
        int other = org("Rival Org");
        int rivalAthlete = athlete(other, "Rival", "Person");
        payment(other, membership(other, rivalAthlete, membershipType(other, "Yearly", 900, 12), today.minusDays(5), today.plusDays(5), 900, "Active"), 900, "Failed", today.minusDays(1));
        getAs(admin, "/api/intelligence/retention").andExpect(jsonPath("$.athletes[?(@.name=='Rival Person')]", hasSize(0)));
        getAs(admin, "/api/intelligence/anomalies").andExpect(jsonPath("$", hasSize(0)));
    }
}
