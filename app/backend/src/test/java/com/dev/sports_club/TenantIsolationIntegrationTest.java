package com.dev.sports_club;

import com.dev.sports_club.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Two organizations side by side: neither may see, change or reference the other's data. */
class TenantIsolationIntegrationTest extends IntegrationTestBase {

    private int orgA, orgB;
    private int athleteA, athleteB, sportA, sportB, teamA, teamB, coachA, coachB;
    private MockHttpSession adminA, adminB;

    @BeforeEach
    void seed() {
        orgA = org("Org A");
        orgB = org("Org B");
        user(orgA, "admin.a", "Admin");
        user(orgB, "admin.b", "Admin");
        sportA = sport(orgA, "Football");
        sportB = sport(orgB, "Football"); // same name is fine in a different organization
        coachA = coach(orgA, "Ann", "Coach");
        coachB = coach(orgB, "Bob", "Coach");
        teamA = team(orgA, "Same Name FC", sportA, coachA);
        teamB = team(orgB, "Same Name FC", sportB, coachB);
        athleteA = athlete(orgA, "Alice", "Alpha");
        athleteB = athlete(orgB, "Bruno", "Beta");
        adminA = login("admin.a");
        adminB = login("admin.b");
    }

    @Test
    @DisplayName("list endpoints only return the caller's organization")
    void lists() throws Exception {
        getAs(adminA, "/api/athletes").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].firstName").value("Alice"));
        getAs(adminB, "/api/athletes").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].firstName").value("Bruno"));
        getAs(adminA, "/api/teams").andExpect(jsonPath("$", hasSize(1)));
        getAs(adminA, "/api/sports").andExpect(jsonPath("$", hasSize(1)));
        getAs(adminA, "/api/coaches").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].firstName").value("Ann"));
    }

    @Test
    @DisplayName("another organization's record looks like it does not exist: read, update and delete")
    void byId() throws Exception {
        getAs(adminA, "/api/athletes/" + athleteB).andExpect(status().isNotFound());
        putAs(adminA, "/api/athletes/" + athleteB,
                "{\"firstName\":\"Hacked\",\"lastName\":\"X\",\"dateOfBirth\":\"2000-01-01\",\"gender\":\"Male\",\"phone\":\"1\"}").andExpect(status().isNotFound());
        deleteAs(adminA, "/api/athletes/" + athleteB); // no-op: must not delete
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM athlete WHERE athlete_id = ? AND first_name = 'Bruno'", Integer.class, athleteB)).isEqualTo(1);
        getAs(adminB, "/api/teams/" + teamA).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("a record cannot reference another organization's data")
    void crossReferences() throws Exception {
        postAs(adminA, "/api/teams", "{\"teamName\":\"Sneaky\",\"sportId\":" + sportB + ",\"coachId\":" + coachA + "}").andExpect(status().isBadRequest());
        postAs(adminA, "/api/teams", "{\"teamName\":\"Sneaky\",\"sportId\":" + sportA + ",\"coachId\":" + coachB + "}").andExpect(status().isBadRequest());
        int type = membershipType(orgA, "Monthly", 50, 1);
        postAs(adminA, "/api/memberships", "{\"athleteId\":" + athleteB + ",\"typeId\":" + type + ",\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\",\"amountCharged\":50,\"status\":\"Active\"}")
                .andExpect(status().isBadRequest());
        postAs(adminA, "/api/team-rosters", "{\"teamId\":" + teamB + ",\"athleteId\":" + athleteA + "}").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("new records are stamped with the caller's organization")
    void stamping() throws Exception {
        postAs(adminA, "/api/sports", "{\"sportName\":\"Rugby\"}").andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT organization_id FROM sport WHERE sport_name = 'Rugby'", Integer.class)).isEqualTo(orgA);
        getAs(adminB, "/api/sports").andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("users, audit log and organization details are per organization")
    void usersAndAudit() throws Exception {
        getAs(adminA, "/api/users").andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].username").value("admin.a"));
        int otherUser = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username='admin.b'", Integer.class);
        getAs(adminA, "/api/users/" + otherUser).andExpect(status().isNotFound());
        putAs(adminA, "/api/users/" + otherUser, "{\"username\":\"admin.b\",\"role\":\"Admin\",\"isActive\":false}").andExpect(status().isNotFound());

        postAs(adminA, "/api/sports", "{\"sportName\":\"Rugby\"}").andExpect(status().isCreated());
        getAs(adminA, "/api/audit-logs?entityType=sport").andExpect(jsonPath("$", hasSize(1)));
        getAs(adminB, "/api/audit-logs?entityType=sport").andExpect(jsonPath("$", hasSize(0)));
        getAs(adminA, "/api/organization").andExpect(jsonPath("$.name").value("Org A"));
    }

    @Test
    @DisplayName("only a Super Admin can list or create organizations")
    void organizationsAreSuperAdminOnly() throws Exception {
        getAs(adminA, "/api/organizations").andExpect(status().isForbidden());
        postAs(adminA, "/api/organizations", "{\"name\":\"X\",\"adminUsername\":\"x.admin\",\"adminPassword\":\"Passw0rd!x1\"}").andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a Super Admin sees nothing until they choose an organization, then acts as its admin")
    void superAdmin() throws Exception {
        user(null, "super", "SuperAdmin");
        MockHttpSession sup = login("super");
        getAs(sup, "/api/athletes").andExpect(jsonPath("$", hasSize(0)));
        postAs(sup, "/api/sports", "{\"sportName\":\"Nope\"}").andExpect(status().isBadRequest());
        getAs(sup, "/api/organizations").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(get("/api/athletes").session(sup).header("X-Organization-Id", orgB)).andExpect(jsonPath("$[0].firstName").value("Bruno"));
        mvc.perform(get("/api/athletes").session(sup).header("X-Organization-Id", orgA)).andExpect(jsonPath("$[0].firstName").value("Alice"));
        mvc.perform(get("/api/athletes").session(sup).header("X-Organization-Id", 9999)).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(post("/api/sports").session(sup).with(csrf()).header("X-Organization-Id", orgB).contentType(JSON).content("{\"sportName\":\"Chess\"}")).andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT organization_id FROM sport WHERE sport_name='Chess'", Integer.class)).isEqualTo(orgB);
    }

    @Test
    @DisplayName("an organization admin cannot pick another organization with the header")
    void headerIgnoredForNonSuper() throws Exception {
        mvc.perform(get("/api/athletes").session(adminA).header("X-Organization-Id", orgB)).andExpect(jsonPath("$[0].firstName").value("Alice"));
    }

    @Test
    @DisplayName("creating an organization creates its first admin, who is isolated from the others")
    void createOrganization() throws Exception {
        user(null, "super", "SuperAdmin");
        MockHttpSession sup = login("super");
        postAs(sup, "/api/organizations", "{\"name\":\"Org C\",\"plan\":\"Starter\",\"adminUsername\":\"admin.c\",\"adminPassword\":\"Passw0rd!x1\"}")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.userCount").value(1));
        MockHttpSession adminC = login("admin.c");
        getAs(adminC, "/api/athletes").andExpect(jsonPath("$", hasSize(0)));
        postAs(sup, "/api/organizations", "{\"name\":\"org c\",\"adminUsername\":\"admin.c2\",\"adminPassword\":\"Passw0rd!x1\"}").andExpect(status().isBadRequest());
        postAs(sup, "/api/organizations", "{\"name\":\"Org D\",\"adminUsername\":\"admin.d\",\"adminPassword\":\"short\"}").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("suspending an organization ends its sessions and blocks sign-in")
    void suspension() throws Exception {
        user(null, "super", "SuperAdmin");
        MockHttpSession sup = login("super");
        putAs(sup, "/api/organizations/" + orgB, "{\"name\":\"Org B\",\"status\":\"Suspended\"}").andExpect(status().isOk());
        getAs(adminB, "/api/athletes").andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON).content("{\"username\":\"admin.b\",\"password\":\"" + PASSWORD + "\"}")).andExpect(status().isUnauthorized());
        getAs(adminA, "/api/athletes").andExpect(status().isOk());
    }
}
