package com.dev.sports_club;

import com.dev.sports_club.demo.DemoDataSeeder;
import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** The demo dataset has to tell the story the investor demo relies on, so this guards it. */
class DemoDataIntegrationTest extends IntegrationTestBase {

    private static final String DEMO_PASSWORD = "Lions-2468-abcdef";

    @Autowired PlatformTransactionManager txManager;

    private DemoDataSeeder.Summary summary;
    private MockHttpSession admin;

    @BeforeEach
    void seed() {
        summary = new DemoDataSeeder(jdbc, encoder, new TransactionTemplate(txManager), "").seed(DEMO_PASSWORD);
        admin = login(DemoDataSeeder.ADMIN, DEMO_PASSWORD);
    }

    @Test
    @DisplayName("creates a believable club, not an empty shell")
    void size() {
        assertThat(summary.athletes()).isGreaterThanOrEqualTo(60);
        assertThat(summary.memberships()).isGreaterThan(summary.athletes());
        assertThat(summary.payments()).isGreaterThan(summary.athletes());
        assertThat(summary.sessions()).isGreaterThan(80);
        assertThat(summary.attendance()).isGreaterThan(500);
        assertThat(summary.fixtures()).isGreaterThanOrEqualTo(15);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM organization", Integer.class)).isEqualTo(1);
    }

    @Test
    @DisplayName("every demo account signs in with the demo password and lands in its own role")
    void accounts() throws Exception {
        for (String[] a : new String[][]{{DemoDataSeeder.ADMIN, "Admin"}, {DemoDataSeeder.FRONT_DESK, "FrontDesk"}, {DemoDataSeeder.COACH, "Coach"}, {DemoDataSeeder.ATHLETE, "Athlete"}}) {
            getAs(login(a[0], DEMO_PASSWORD), "/api/auth/me").andExpect(status().isOk()).andExpect(jsonPath("$.role").value(a[1])).andExpect(jsonPath("$.organizationId").isNumber());
        }
    }

    @Test
    @DisplayName("data is dated relative to today: active memberships exist and some end within three weeks")
    void currentDates() {
        LocalDate today = LocalDate.now();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM membership WHERE status='Active' AND end_date >= ?", Integer.class, today)).isGreaterThan(40);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM membership WHERE status='Active' AND end_date BETWEEN ? AND ?", Integer.class, today, today.plusDays(21))).isGreaterThanOrEqualTo(8);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM membership WHERE status='Active' AND end_date < ?", Integer.class, today)).isZero();
        assertThat(jdbc.queryForObject("SELECT MAX(session_date) FROM training_session", LocalDate.class)).isBefore(today);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM fixture WHERE status='Scheduled' AND match_date > ?", Integer.class, today)).isEqualTo(4);
    }

    @Test
    @DisplayName("analytics: revenue is real, and the twelve-month trend is upward")
    void analytics() throws Exception {
        LocalDate today = LocalDate.now();
        getAs(admin, "/api/analytics/overview?from=" + today.minusDays(89) + "&to=" + today).andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.revenue.value", greaterThan(1000.0)))
                .andExpect(jsonPath("$.kpis.activeMemberships.value", greaterThan(40.0)))
                .andExpect(jsonPath("$.kpis.attendanceRate.value", allOf(greaterThan(40.0), lessThan(100.0))))
                .andExpect(jsonPath("$.teams", hasSize(8)))
                .andExpect(jsonPath("$.facilities", hasSize(6)));
    }

    @Test
    @DisplayName("forecast has a 3-month projection with growth, and the pipeline sees renewals coming")
    void forecast() throws Exception {
        getAs(admin, "/api/intelligence/revenue-forecast").andExpect(status().isOk())
                .andExpect(jsonPath("$.history.length()", greaterThanOrEqualTo(6)))
                .andExpect(jsonPath("$.forecast", hasSize(3)))
                .andExpect(jsonPath("$.monthlyChange", greaterThan(0.0)))
                .andExpect(jsonPath("$.pipeline.membershipsEnding", greaterThan(0)));
    }

    @Test
    @DisplayName("retention finds the drifting athletes, ranks them first and explains each one")
    void retention() throws Exception {
        getAs(admin, "/api/intelligence/retention").andExpect(status().isOk())
                .andExpect(jsonPath("$.high", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.athletes[0].score", greaterThanOrEqualTo(60)))
                .andExpect(jsonPath("$.athletes[0].factors.length()", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.athletes[0].action", not(equalTo("No action needed"))));
    }

    @Test
    @DisplayName("the three planted payment oddities are all detected")
    void anomalies() throws Exception {
        getAs(admin, "/api/intelligence/anomalies").andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.type=='Possible duplicate')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='Repeated failures')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.type=='Stale pending payment')]", hasSize(1)));
    }

    @Test
    @DisplayName("league table is consistent: 8 played games, points add up")
    void standings() throws Exception {
        int league = jdbc.queryForObject("SELECT competition_id FROM competition WHERE comp_name = 'Accra Youth League'", Integer.class);
        String json = getAs(admin, "/api/fixtures/standings?competitionId=" + league).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(4)))
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("Lions Seniors");
        int played = jdbc.queryForObject("SELECT COUNT(*) FROM fixture WHERE competition_id = ? AND status = 'Completed'", Integer.class, league);
        assertThat(played).isEqualTo(8);
        int stored = jdbc.queryForObject("SELECT SUM(points_scored) FROM team_competition WHERE competition_id = ?", Integer.class, league);
        int draws = jdbc.queryForObject("SELECT COUNT(*) FROM fixture WHERE competition_id = ? AND status = 'Completed' AND home_score = away_score", Integer.class, league);
        assertThat(stored).isEqualTo(3 * (played - draws) + 2 * draws);
    }

    @Test
    @DisplayName("roles see what they should: the coach has no money, the athlete only their own record")
    void roleViews() throws Exception {
        MockHttpSession coach = login(DemoDataSeeder.COACH, DEMO_PASSWORD);
        getAs(coach, "/api/payments").andExpect(status().isForbidden());
        getAs(coach, "/api/teams").andExpect(status().isOk());
        MockHttpSession athlete = login(DemoDataSeeder.ATHLETE, DEMO_PASSWORD);
        int own = jdbc.queryForObject("SELECT athlete_id FROM app_user WHERE username = ?", Integer.class, DemoDataSeeder.ATHLETE);
        int other = jdbc.queryForObject("SELECT athlete_id FROM athlete WHERE athlete_id <> ? LIMIT 1", Integer.class, own);
        getAs(athlete, "/api/intelligence/athletes/" + own).andExpect(status().isOk());
        assertThat(statusOf(getAs(athlete, "/api/intelligence/athletes/" + other))).isIn(403, 404);
    }

    @Test
    @DisplayName("every report runs on the demo data and the financial totals match the payments")
    void reports() throws Exception {
        LocalDate today = LocalDate.now();
        String range = "from=" + today.minusDays(89) + "&to=" + today;
        for (String type : new String[]{"athletes", "memberships", "financial", "attendance", "performance", "facilities", "competitions"}) {
            getAs(admin, "/api/reports/" + type + "?" + range).andExpect(status().isOk()).andExpect(jsonPath("$.rows.length()", greaterThan(0)));
        }
        double collected = jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM payment WHERE status='Completed' AND payment_date >= ? AND payment_date < ?", Double.class, today.minusDays(89).atStartOfDay(), today.plusDays(1).atStartOfDay());
        String expected = "GH₵" + String.format(java.util.Locale.ROOT, "%,.2f", collected);
        getAs(admin, "/api/reports/financial?" + range).andExpect(jsonPath("$.summary[?(@.label=='Collected')].value").value(expected));
    }

    @Test
    @DisplayName("seeding twice is safe when done through the runner, which skips an existing organization")
    void idempotentRunner() throws Exception {
        new DemoDataSeeder(jdbc, encoder, new TransactionTemplate(txManager), DEMO_PASSWORD).run(null);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM organization WHERE slug = ?", Integer.class, DemoDataSeeder.ORG_SLUG)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM athlete", Integer.class)).isEqualTo(summary.athletes());
    }
}
