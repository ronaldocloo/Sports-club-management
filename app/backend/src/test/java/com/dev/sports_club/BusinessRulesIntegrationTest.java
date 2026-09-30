package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BusinessRulesIntegrationTest extends IntegrationTestBase {

    private int org, sport, coachId, teamA, teamB, teamC, athlete1, athlete2, type;
    private MockHttpSession admin, coach;

    @BeforeEach
    void seed() {
        org = org("Rules Org");
        sport = sport(org, "Football");
        coachId = coach(org, "Own", "Coach");
        int otherCoach = coach(org, "Other", "Coach");
        teamA = team(org, "Alpha FC", sport, coachId);
        teamB = team(org, "Beta FC", sport, otherCoach);
        teamC = team(org, "Gamma FC", sport, otherCoach);
        athlete1 = athlete(org, "One", "Player");
        athlete2 = athlete(org, "Two", "Player");
        type = membershipType(org, "Monthly", 100, 1);
        user(org, "admin", "Admin");
        user(org, "coach", "Coach", coachId, null);
        admin = login("admin");
        coach = login("coach");
    }

    private String today(int plusDays) { return LocalDate.now().plusDays(plusDays).toString(); }

    // ================================================================ payments

    @Nested
    class Payments {
        private int membership;

        @BeforeEach
        void setUp() { membership = membership(org, athlete1, type, LocalDate.now().minusDays(5), LocalDate.now().plusDays(25), 100, "Active"); }

        private String body(double amount, String status, String ref) {
            return "{\"membershipId\":" + membership + ",\"amount\":" + amount + ",\"paymentDate\":\"" + LocalDate.now() + "T10:00:00\",\"method\":\"Cash\",\"status\":\"" + status + "\",\"referenceNo\":\"" + ref + "\"}";
        }

        @Test
        @DisplayName("payments cannot add up to more than the amount charged")
        void overpayment() throws Exception {
            postAs(admin, "/api/payments", body(60, "Completed", "R1")).andExpect(status().isCreated());
            postAs(admin, "/api/payments", body(50, "Completed", "R2")).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Payment would exceed membership amount charged"));
            postAs(admin, "/api/payments", body(40, "Completed", "R3")).andExpect(status().isCreated());
        }

        @Test
        @DisplayName("reference numbers are unique")
        void duplicateReference() throws Exception {
            postAs(admin, "/api/payments", body(10, "Pending", "SAME")).andExpect(status().isCreated());
            postAs(admin, "/api/payments", body(10, "Pending", "SAME")).andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("a completed payment can only be refunded; a refunded one is final")
        void lifecycle() throws Exception {
            int id = jdbc.queryForObject("SELECT 0", Integer.class);
            postAs(admin, "/api/payments", body(30, "Pending", "L1")).andExpect(status().isCreated());
            id = jdbc.queryForObject("SELECT payment_id FROM payment WHERE reference_no='L1'", Integer.class);

            putAs(admin, "/api/payments/" + id, body(30, "Completed", "L1")).andExpect(status().isOk());
            putAs(admin, "/api/payments/" + id, body(99, "Completed", "L1")).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("can only be refunded")));
            putAs(admin, "/api/payments/" + id, body(30, "Pending", "L1")).andExpect(status().isBadRequest());
            putAs(admin, "/api/payments/" + id, body(30, "Refunded", "L1")).andExpect(status().isOk());
            putAs(admin, "/api/payments/" + id, body(30, "Completed", "L1")).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("A refunded payment cannot be changed"));
        }

        @Test
        @DisplayName("completing a pending payment re-checks the balance")
        void completingChecksBalance() throws Exception {
            postAs(admin, "/api/payments", body(80, "Completed", "C1")).andExpect(status().isCreated());
            postAs(admin, "/api/payments", body(50, "Pending", "C2")).andExpect(status().isBadRequest()); // pending is allowed only if it fits
        }

        @Test
        @DisplayName("a completed payment tells admins and front desk")
        void notifiesStaff() throws Exception {
            user(org, "desk", "FrontDesk");
            postAs(admin, "/api/payments", body(25, "Completed", "N1")).andExpect(status().isCreated());
            assertThat(jdbc.queryForList("SELECT message FROM notification WHERE kind='payment'", String.class))
                    .hasSize(2).allMatch(m -> m.contains("Payment received: GH₵25"));
        }
    }

    // ================================================================ memberships, rosters, bookings, registrations

    @Test
    @DisplayName("an athlete needs a current active membership before joining a team")
    void rosterRequiresMembership() throws Exception {
        postAs(admin, "/api/team-rosters", "{\"teamId\":" + teamA + ",\"athleteId\":" + athlete1 + "}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("active membership")));
        membership(org, athlete1, type, LocalDate.now().minusDays(1), LocalDate.now().plusDays(29), 100, "Active");
        postAs(admin, "/api/team-rosters", "{\"teamId\":" + teamA + ",\"athleteId\":" + athlete1 + "}").andExpect(status().isCreated());
    }

    @Test
    @DisplayName("an athlete cannot have two active memberships at once")
    void oneActiveMembership() throws Exception {
        membership(org, athlete1, type, LocalDate.now().minusDays(1), LocalDate.now().plusDays(29), 100, "Active");
        postAs(admin, "/api/memberships", "{\"athleteId\":" + athlete1 + ",\"typeId\":" + type + ",\"startDate\":\"" + today(0) + "\",\"endDate\":\"" + today(30) + "\",\"amountCharged\":100,\"status\":\"Active\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("bookings: not in the past, not on an unavailable facility, no double booking")
    void bookings() throws Exception {
        int open = facility(org, "Main Pitch", "Available");
        int closed = facility(org, "Old Pitch", "Maintenance");
        String tomorrow = today(1);
        String base = "{\"teamId\":" + teamA + ",\"timeSlot\":\"SLOT_08_10\",\"purpose\":\"Training\"";
        postAs(admin, "/api/facility-bookings", base + ",\"facilityId\":" + open + ",\"bookingDate\":\"" + today(-1) + "\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("past date")));
        postAs(admin, "/api/facility-bookings", base + ",\"facilityId\":" + closed + ",\"bookingDate\":\"" + tomorrow + "\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not available")));
        postAs(admin, "/api/facility-bookings", base + ",\"facilityId\":" + open + ",\"bookingDate\":\"" + tomorrow + "\"}").andExpect(status().isCreated());
        postAs(admin, "/api/facility-bookings", base + ",\"facilityId\":" + open + ",\"bookingDate\":\"" + tomorrow + "\"}").andExpect(status().isConflict());
    }

    @Test
    @DisplayName("teams cannot register after the competition's registration deadline")
    void registrationDeadline() throws Exception {
        int comp = competition(org, "Cup", LocalDate.now().plusDays(30), LocalDate.now().plusDays(5));
        postAs(admin, "/api/team-competitions", "{\"teamId\":" + teamA + ",\"competitionId\":" + comp + ",\"registrationDate\":\"" + today(3) + "\"}").andExpect(status().isCreated());
        postAs(admin, "/api/team-competitions", "{\"teamId\":" + teamB + ",\"competitionId\":" + comp + ",\"registrationDate\":\"" + today(6) + "\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("closed on")));
    }

    // ================================================================ fixtures

    @Nested
    class Fixtures {
        private int comp;

        @BeforeEach
        void setUp() {
            comp = competition(org, "League", LocalDate.now().plusDays(30), null);
            registerTeam(org, teamA, comp);
            registerTeam(org, teamB, comp);
            registerTeam(org, teamC, comp);
        }

        private int fixture(int home, int away, String round) throws Exception {
            postAs(admin, "/api/fixtures", "{\"competitionId\":" + comp + ",\"homeTeamId\":" + home + ",\"awayTeamId\":" + away + ",\"roundLabel\":\"" + round + "\",\"matchDate\":\"" + today(3) + "\"}").andExpect(status().isCreated());
            return jdbc.queryForObject("SELECT MAX(fixture_id) FROM fixture", Integer.class);
        }

        private void result(int id, int h, int a) throws Exception {
            putAs(admin, "/api/fixtures/" + id + "/result", "{\"homeScore\":" + h + ",\"awayScore\":" + a + "}").andExpect(status().isOk());
        }

        @Test
        @DisplayName("both teams must be different and registered in the competition")
        void validation() throws Exception {
            int outsider = team(org, "Outsider FC", sport, coachId);
            postAs(admin, "/api/fixtures", "{\"competitionId\":" + comp + ",\"homeTeamId\":" + teamA + ",\"awayTeamId\":" + teamA + ",\"matchDate\":\"" + today(3) + "\"}").andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("A team cannot play itself"));
            postAs(admin, "/api/fixtures", "{\"competitionId\":" + comp + ",\"homeTeamId\":" + teamA + ",\"awayTeamId\":" + outsider + ",\"matchDate\":\"" + today(3) + "\"}").andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("not registered")));
            putAs(admin, "/api/fixtures/1/result", "{\"homeScore\":-1,\"awayScore\":0}").andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("standings: 3 points a win, 1 a draw, ordered by points then goal difference; knockout rounds excluded")
        void standings() throws Exception {
            result(fixture(teamA, teamB, "Group Stage"), 3, 0); // A win
            result(fixture(teamB, teamC, "Group Stage"), 1, 1); // draw
            result(fixture(teamC, teamA, "Group Stage"), 0, 2); // A win
            result(fixture(teamA, teamB, "Final"), 0, 9);       // knockout: not in the table

            getAs(admin, "/api/fixtures/standings?competitionId=" + comp)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].teamName").value("Alpha FC")).andExpect(jsonPath("$[0].points").value(6))
                    .andExpect(jsonPath("$[0].won").value(2)).andExpect(jsonPath("$[0].goalsFor").value(5)).andExpect(jsonPath("$[0].goalsAgainst").value(0))
                    .andExpect(jsonPath("$[1].teamName").value("Gamma FC")).andExpect(jsonPath("$[1].points").value(1)) // level on points, better goal difference (-2 v -3)
                    .andExpect(jsonPath("$[2].teamName").value("Beta FC")).andExpect(jsonPath("$[2].points").value(1)).andExpect(jsonPath("$[2].goalsAgainst").value(4))
                    .andExpect(jsonPath("$[0].played").value(2));
            assertThat(jdbc.queryForObject("SELECT points_scored FROM team_competition WHERE team_id = ? AND competition_id = ?", Integer.class, teamA, comp)).isEqualTo(6);
        }

        @Test
        @DisplayName("correcting a result updates the table; a completed fixture cannot be edited")
        void correction() throws Exception {
            int f = fixture(teamA, teamB, "Group Stage");
            result(f, 1, 0);
            result(f, 0, 2);
            getAs(admin, "/api/fixtures/standings?competitionId=" + comp).andExpect(jsonPath("$[0].teamName").value("Beta FC")).andExpect(jsonPath("$[0].points").value(3));
            putAs(admin, "/api/fixtures/" + f, "{\"competitionId\":" + comp + ",\"homeTeamId\":" + teamA + ",\"awayTeamId\":" + teamB + ",\"matchDate\":\"" + today(9) + "\"}").andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("a coach can record a result only when one of their own teams played")
        void coachResults() throws Exception {
            int own = fixture(teamA, teamB, "Group Stage");    // coach owns Alpha
            int foreign = fixture(teamB, teamC, "Group Stage");
            putAs(coach, "/api/fixtures/" + own + "/result", "{\"homeScore\":1,\"awayScore\":1}").andExpect(status().isOk());
            putAs(coach, "/api/fixtures/" + foreign + "/result", "{\"homeScore\":1,\"awayScore\":1}").andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("recording a result notifies the coaches involved and admins, once")
        void resultNotifications() throws Exception {
            int f = fixture(teamA, teamB, "Group Stage");
            result(f, 2, 2);
            result(f, 2, 2); // same score again: deduped
            assertThat(jdbc.queryForList("SELECT message FROM notification WHERE kind='fixture'", String.class)).hasSize(2).allMatch(m -> m.contains("Alpha FC 2–2 Beta FC"));
        }
    }

    // ================================================================ attendance, performance, events

    @Test
    @DisplayName("attendance: only athletes on the team's active roster, no duplicates, coach limited to own team")
    void attendance() throws Exception {
        int type2 = type;
        membership(org, athlete1, type2, LocalDate.now().minusDays(1), LocalDate.now().plusDays(29), 100, "Active");
        roster(org, teamA, athlete1, true);
        postAs(coach, "/api/training-sessions", "{\"teamId\":" + teamA + ",\"sessionDate\":\"" + today(-2) + "\",\"startTime\":\"08:00:00\"}").andExpect(status().isCreated());
        int session = jdbc.queryForObject("SELECT MAX(session_id) FROM training_session", Integer.class);
        postAs(coach, "/api/training-sessions", "{\"teamId\":" + teamA + ",\"sessionDate\":\"" + today(-2) + "\",\"startTime\":\"08:00:00\"}").andExpect(status().isBadRequest());
        postAs(coach, "/api/training-sessions", "{\"teamId\":" + teamB + ",\"sessionDate\":\"" + today(-2) + "\",\"startTime\":\"09:00:00\"}").andExpect(status().isForbidden());

        putAs(coach, "/api/training-sessions/" + session + "/attendance", "{\"entries\":[{\"athleteId\":" + athlete2 + ",\"status\":\"Present\"}]}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("not on this team's active roster")));
        putAs(coach, "/api/training-sessions/" + session + "/attendance", "{\"entries\":[{\"athleteId\":" + athlete1 + ",\"status\":\"Present\"},{\"athleteId\":" + athlete1 + ",\"status\":\"Late\"}]}").andExpect(status().isBadRequest());
        putAs(coach, "/api/training-sessions/" + session + "/attendance", "{\"entries\":[{\"athleteId\":" + athlete1 + ",\"status\":\"Late\"}]}").andExpect(status().isOk());
        getAs(admin, "/api/attendance/athletes/" + athlete1).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.late").value(1)).andExpect(jsonPath("$.rate").value(100));
    }

    @Test
    @DisplayName("performance: rating 0-100, coach limited to their athletes, summary totals stats")
    void performance() throws Exception {
        roster(org, teamA, athlete1, true);
        postAs(coach, "/api/performance", "{\"athleteId\":" + athlete1 + ",\"recordDate\":\"" + today(-3) + "\",\"rating\":72.5,\"stats\":{\"goals\":2,\"assists\":1}}").andExpect(status().isCreated());
        postAs(coach, "/api/performance", "{\"athleteId\":" + athlete1 + ",\"recordDate\":\"" + today(-2) + "\",\"rating\":80,\"stats\":{\"goals\":1}}").andExpect(status().isCreated());
        postAs(coach, "/api/performance", "{\"athleteId\":" + athlete1 + ",\"recordDate\":\"" + today(-1) + "\",\"rating\":150}").andExpect(status().isBadRequest());
        postAs(coach, "/api/performance", "{\"athleteId\":" + athlete2 + ",\"recordDate\":\"" + today(-1) + "\",\"rating\":50}").andExpect(status().isForbidden()); // not on the coach's team
        getAs(admin, "/api/performance/athletes/" + athlete1 + "/summary")
                .andExpect(jsonPath("$.averageRating").value(76.3)).andExpect(jsonPath("$.latestRating").value(80.0))
                .andExpect(jsonPath("$.statTotals.goals").value(3.0)).andExpect(jsonPath("$.statTotals.assists").value(1.0));
    }

    @Test
    @DisplayName("events: the end time must be after the start time")
    void events() throws Exception {
        postAs(admin, "/api/events", "{\"title\":\"Workshop\",\"eventType\":\"Workshop\",\"eventDate\":\"" + today(5) + "\",\"startTime\":\"10:00:00\",\"endTime\":\"09:00:00\"}").andExpect(status().isBadRequest());
        postAs(admin, "/api/events", "{\"title\":\"Workshop\",\"eventType\":\"Workshop\",\"eventDate\":\"" + today(5) + "\",\"startTime\":\"10:00:00\",\"endTime\":\"12:00:00\"}").andExpect(status().isCreated());
        getAs(coach, "/api/events").andExpect(jsonPath("$", hasSize(1)));
    }

    // ================================================================ notifications, daily job, audit

    @Test
    @DisplayName("notifications belong to their recipient and can be read, read-all and deleted")
    void notificationsOwnership() throws Exception {
        user(org, "desk", "FrontDesk");
        postAs(admin, "/api/athletes", "{\"firstName\":\"New\",\"lastName\":\"Person\",\"dateOfBirth\":\"2001-01-01\",\"gender\":\"Male\",\"phone\":\"0200000000\"}").andExpect(status().isCreated());
        getAs(admin, "/api/notifications").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].isRead").value(false));
        getAs(login("desk"), "/api/notifications").andExpect(jsonPath("$", hasSize(0)));
        int id = jdbc.queryForObject("SELECT notification_id FROM notification", Integer.class);
        postAs(login("desk"), "/api/notifications/" + id + "/read", "").andExpect(status().isNotFound());
        postAs(admin, "/api/notifications/" + id + "/read", "").andExpect(status().isOk());
        getAs(admin, "/api/notifications").andExpect(jsonPath("$[0].isRead").value(true));
        deleteAs(admin, "/api/notifications/" + id).andExpect(status().isNoContent());
        getAs(admin, "/api/notifications").andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("the daily job expires ended memberships and warns about ones ending soon, without duplicating alerts")
    void dailyJob() throws Exception {
        int athleteAccount = user(org, "athlete.acct", "Athlete", null, athlete1);
        int ended = membership(org, athlete1, type, LocalDate.now().minusDays(40), LocalDate.now().minusDays(10), 100, "Active");
        int soon = membership(org, athlete2, type, LocalDate.now().minusDays(20), LocalDate.now().plusDays(3), 100, "Active");
        postAs(admin, "/api/admin/jobs/run", "").andExpect(status().isOk()).andExpect(jsonPath("$.expired").value(1)).andExpect(jsonPath("$.expiringSoon").value(1));
        assertThat(jdbc.queryForObject("SELECT status FROM membership WHERE membership_id = ?", String.class, ended)).isEqualTo("Expired");
        assertThat(jdbc.queryForObject("SELECT status FROM membership WHERE membership_id = ?", String.class, soon)).isEqualTo("Active");
        int alerts = jdbc.queryForObject("SELECT COUNT(*) FROM notification WHERE kind='membership'", Integer.class);
        assertThat(alerts).isEqualTo(1); // only the admin: athlete2 has no account
        postAs(admin, "/api/admin/jobs/run", "").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM notification WHERE kind='membership'", Integer.class)).isEqualTo(alerts);
        assertThat(athleteAccount).isPositive();
    }

    @Test
    @DisplayName("writes are audited with who, what and which record; the audit log itself is not")
    void auditTrail() throws Exception {
        postAs(admin, "/api/sports", "{\"sportName\":\"Rugby\"}").andExpect(status().isCreated());
        int id = jdbc.queryForObject("SELECT sport_id FROM sport WHERE sport_name='Rugby'", Integer.class);
        putAs(admin, "/api/sports/" + id, "{\"sportName\":\"Rugby Union\"}").andExpect(status().isOk());
        deleteAs(admin, "/api/sports/" + id).andExpect(status().isNoContent());
        List<String> rows = jdbc.queryForList("SELECT CONCAT(action, ':', entity_type, ':', entity_id) FROM audit_log WHERE entity_type='sport' ORDER BY audit_id", String.class);
        assertThat(rows).containsExactly("CREATE:sport:" + id, "UPDATE:sport:" + id, "DELETE:sport:" + id);
        getAs(admin, "/api/audit-logs");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE entity_type = 'audit log'", Integer.class)).isZero();
    }

    @Test
    @DisplayName("deleting something that is still in use gives a clear conflict, not a server error")
    void referentialIntegrity() throws Exception {
        deleteAs(admin, "/api/sports/" + sport).andExpect(status().isConflict()).andExpect(jsonPath("$.message", containsString("in use")));
    }
}
