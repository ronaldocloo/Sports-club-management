package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Coaches see only their teams and athletes; athletes see only themselves. */
class DataScopeIntegrationTest extends IntegrationTestBase {

    private int org, ownTeam, otherTeam, ownAthlete, teammate, strangerAthlete, ownMembership, otherMembership, ownPayment, otherPayment;
    private MockHttpSession coachSession, athleteSession;

    @BeforeEach
    void seed() {
        org = org("Scope Org");
        int sport = sport(org, "Football");
        int coach1 = coach(org, "Own", "Coach");
        int coach2 = coach(org, "Other", "Coach");
        ownTeam = team(org, "Own FC", sport, coach1);
        otherTeam = team(org, "Other FC", sport, coach2);
        ownAthlete = athlete(org, "Own", "Athlete");
        teammate = athlete(org, "Team", "Mate");
        strangerAthlete = athlete(org, "Stranger", "Danger");
        roster(org, ownTeam, ownAthlete, true);
        roster(org, ownTeam, teammate, true);
        roster(org, otherTeam, strangerAthlete, true);
        int type = membershipType(org, "Monthly", 50, 1);
        ownMembership = membership(org, ownAthlete, type, java.time.LocalDate.now().minusDays(5), java.time.LocalDate.now().plusDays(25), 50, "Active");
        otherMembership = membership(org, strangerAthlete, type, java.time.LocalDate.now().minusDays(5), java.time.LocalDate.now().plusDays(25), 50, "Active");
        ownPayment = payment(org, ownMembership, 50, "Completed", java.time.LocalDate.now().minusDays(4));
        otherPayment = payment(org, otherMembership, 50, "Completed", java.time.LocalDate.now().minusDays(4));
        user(org, "coach", "Coach", coach1, null);
        user(org, "athlete", "Athlete", null, ownAthlete);
        coachSession = login("coach");
        athleteSession = login("athlete");
    }

    @Test
    @DisplayName("a coach sees only their own team and its athletes")
    void coachScope() throws Exception {
        getAs(coachSession, "/api/teams").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].teamName").value("Own FC"));
        getAs(coachSession, "/api/athletes").andExpect(jsonPath("$", hasSize(2)));
        getAs(coachSession, "/api/team-rosters").andExpect(jsonPath("$", hasSize(2)));
        getAs(coachSession, "/api/teams/" + ownTeam).andExpect(status().isOk());
        getAs(coachSession, "/api/teams/" + otherTeam).andExpect(status().isForbidden());
        getAs(coachSession, "/api/athletes/" + teammate).andExpect(status().isOk());
        getAs(coachSession, "/api/athletes/" + strangerAthlete).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an athlete sees only their own record, team, membership and payments")
    void athleteScope() throws Exception {
        getAs(athleteSession, "/api/athletes").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].athleteId").value(ownAthlete));
        getAs(athleteSession, "/api/athletes/" + teammate).andExpect(status().isForbidden());
        getAs(athleteSession, "/api/teams").andExpect(jsonPath("$", hasSize(1)));
        getAs(athleteSession, "/api/memberships").andExpect(jsonPath("$", hasSize(1)));
        getAs(athleteSession, "/api/memberships/" + otherMembership).andExpect(status().isForbidden());
        getAs(athleteSession, "/api/payments").andExpect(jsonPath("$", hasSize(1)));
        getAs(athleteSession, "/api/payments/" + ownPayment).andExpect(status().isOk());
        getAs(athleteSession, "/api/payments/" + otherPayment).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("coaches and athletes cannot change data")
    void readOnly() throws Exception {
        postAs(coachSession, "/api/athletes", "{}").andExpect(status().isForbidden());
        putAs(athleteSession, "/api/athletes/" + ownAthlete, "{}").andExpect(status().isForbidden());
        deleteAs(coachSession, "/api/athletes/" + teammate).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("an athlete-role account without a linked athlete sees nothing")
    void unlinkedAthlete() throws Exception {
        jdbc.update("UPDATE app_user SET athlete_id = NULL WHERE username = 'athlete'");
        getAs(login("athlete"), "/api/athletes").andExpect(jsonPath("$", hasSize(0)));
    }
}
