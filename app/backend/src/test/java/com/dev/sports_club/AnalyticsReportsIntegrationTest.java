package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockHttpSession;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AnalyticsReportsIntegrationTest extends IntegrationTestBase {

    private int org, membership;
    private MockHttpSession admin;
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void seed() {
        org = org("Reports Org");
        int sport = sport(org, "Football");
        int coach = coach(org, "Own", "Coach");
        team(org, "Alpha FC", sport, coach);
        int athlete = athlete(org, "Ama", "Mensah");
        int type = membershipType(org, "Monthly", 100, 1);
        membership = membership(org, athlete, type, today.minusDays(60), today.plusDays(30), 300, "Active");
        payment(org, membership, 100, "Completed", today.minusDays(2));
        payment(org, membership, 50, "Completed", today.minusDays(5));
        payment(org, membership, 30, "Refunded", today.minusDays(6));
        payment(org, membership, 20, "Pending", today.minusDays(1));
        payment(org, membership, 80, "Completed", today.minusDays(40)); // previous period
        user(org, "admin", "Admin");
        user(org, "desk", "FrontDesk");
        user(org, "coach", "Coach", coach, null);
        user(org, "player", "Athlete", null, athlete);
        admin = login("admin");
    }

    private String range() { return "from=" + today.minusDays(29) + "&to=" + today; }

    @Test
    @DisplayName("overview KPIs are exact and compare with the previous period")
    void kpis() throws Exception {
        getAs(admin, "/api/analytics/overview?" + range()).andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.revenue.value").value(150.0))
                .andExpect(jsonPath("$.kpis.revenue.previous").value(80.0))
                .andExpect(jsonPath("$.kpis.revenue.changePct").value(closeTo(87.5, 0.11)))
                .andExpect(jsonPath("$.kpis.activeMemberships.value").value(1.0))
                .andExpect(jsonPath("$.period.from").value(today.minusDays(29).toString()));
    }

    @Test
    @DisplayName("analytics are for Admin, FrontDesk and Coach only, and never mix organizations")
    void overviewAccessAndIsolation() throws Exception {
        assertThat(statusOf(getAs(login("player"), "/api/analytics/overview?" + range()))).isEqualTo(403);
        int other = org("Other Org");
        int m2 = membership(other, athlete(other, "Kofi", "Boateng"), membershipType(other, "Yearly", 900, 12), today.minusDays(10), today.plusDays(300), 900, "Active");
        payment(other, m2, 900, "Completed", today.minusDays(1));
        getAs(admin, "/api/analytics/overview?" + range()).andExpect(jsonPath("$.kpis.revenue.value").value(150.0));
    }

    @Test
    @DisplayName("bad ranges are rejected with a clear message")
    void badRange() throws Exception {
        getAs(admin, "/api/reports/financial?from=" + today + "&to=" + today.minusDays(3)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("on or before")));
        getAs(admin, "/api/reports/financial?from=" + today.minusYears(6) + "&to=" + today).andExpect(status().isBadRequest());
        getAs(admin, "/api/reports/nonsense").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("financial report rows and totals match the payments in range")
    void financialReport() throws Exception {
        getAs(admin, "/api/reports/financial?" + range()).andExpect(status().isOk())
                .andExpect(jsonPath("$.rows", hasSize(4)))
                .andExpect(jsonPath("$.summary[?(@.label=='Collected')].value").value("GH₵150.00"))
                .andExpect(jsonPath("$.summary[?(@.label=='Pending')].value").value("GH₵20.00"))
                .andExpect(jsonPath("$.summary[?(@.label=='Refunded')].value").value("GH₵30.00"))
                .andExpect(header().string("X-Total-Rows", "4"));
        getAs(admin, "/api/reports/financial?" + range() + "&limit=2").andExpect(jsonPath("$.rows", hasSize(2))).andExpect(header().string("X-Total-Rows", "4"));
    }

    @Test
    @DisplayName("CSV, Excel and PDF are real files, named sensibly, and each export is audited")
    void exportFormats() throws Exception {
        byte[] csv = getAs(admin, "/api/reports/financial?" + range() + "&format=csv")
                .andExpect(status().isOk()).andExpect(header().string("Content-Disposition", containsString("financial-report-")))
                .andReturn().getResponse().getContentAsByteArray();
        String text = new String(csv, StandardCharsets.UTF_8);
        assertThat(text).contains("Amount (GHS)").contains("Ama Mensah").contains("Refunded");

        byte[] xlsx = getAs(admin, "/api/reports/financial?" + range() + "&format=xlsx").andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(xlsx, 0, 2, StandardCharsets.ISO_8859_1)).isEqualTo("PK"); // a zip container
        byte[] pdf = getAs(admin, "/api/reports/financial?" + range() + "&format=pdf").andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 4, StandardCharsets.ISO_8859_1)).isEqualTo("%PDF");

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = 'EXPORT' AND organization_id = ?", Integer.class, org)).isEqualTo(3);
        getAs(admin, "/api/reports/financial?" + range()); // viewing on screen is not an export
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action = 'EXPORT' AND organization_id = ?", Integer.class, org)).isEqualTo(3);
        getAs(admin, "/api/reports/financial?" + range() + "&format=docx").andExpect(status().isBadRequest());
    }

    @ParameterizedTest(name = "{0} report: {1} -> {2}")
    @CsvSource({
            "desk,financial,200", "desk,athletes,200", "desk,memberships,200", "desk,attendance,403", "desk,performance,403", "desk,facilities,403",
            "coach,attendance,200", "coach,performance,200", "coach,financial,403", "coach,athletes,403", "coach,facilities,403",
            "player,financial,403", "player,attendance,403", "admin,facilities,200", "admin,competitions,200"
    })
    void reportRoles(String user, String report, int expected) throws Exception {
        assertThat(statusOf(getAs(login(user), "/api/reports/" + report + "?" + range()))).isEqualTo(expected);
    }

    @Test
    @DisplayName("every report type runs and produces a file in every format")
    void allReportsAllFormats() throws Exception {
        for (String type : new String[]{"athletes", "memberships", "financial", "attendance", "performance", "facilities", "competitions"}) {
            for (String format : new String[]{"json", "csv", "xlsx", "pdf"}) {
                assertThat(statusOf(getAs(admin, "/api/reports/" + type + "?" + range() + "&format=" + format))).as(type + " " + format).isEqualTo(200);
            }
        }
    }
}
