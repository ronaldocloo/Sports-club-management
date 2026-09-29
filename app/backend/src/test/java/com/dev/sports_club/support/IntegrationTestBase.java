package com.dev.sports_club.support;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base for tests that run the whole application against the throwaway test database
 * (create it with scripts/setup-test-db.sh). Every test starts from empty tables; the helpers below
 * insert just the rows a test needs, straight through SQL so they do not depend on the code under test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    public static final String PASSWORD = "Passw0rd!x1";

    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected PasswordEncoder encoder;

    private static final List<String> TABLES = List.of(
            "notification", "audit_log", "attendance", "training_session", "performance_record", "fixture", "club_event",
            "payment", "membership", "team_roster", "team_competition", "facility_booking", "app_user", "team", "competition",
            "facility", "athlete", "coach", "sport", "membership_type", "organization");

    protected String hash;

    @BeforeEach
    void resetDatabase() {
        jdbc.execute("SET FOREIGN_KEY_CHECKS=0");
        TABLES.forEach(t -> jdbc.execute("TRUNCATE TABLE " + t));
        jdbc.execute("SET FOREIGN_KEY_CHECKS=1");
        hash = encoder.encode(PASSWORD);
    }

    // ---------------------------------------------------------------- data builders

    protected int insert(String sql, Object... args) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps;
        }, keys);
        Number key = keys.getKey();
        return key == null ? 0 : key.intValue();
    }

    protected int org(String name) {
        return insert("INSERT INTO organization (name, slug, plan, status) VALUES (?, ?, 'Professional', 'Active')", name, name.toLowerCase().replace(' ', '-'));
    }

    protected int user(Integer orgId, String username, String role) { return user(orgId, username, role, null, null); }

    protected int user(Integer orgId, String username, String role, Integer coachId, Integer athleteId) {
        return insert("INSERT INTO app_user (username, password_hash, role, organization_id, coach_id, athlete_id, is_active) VALUES (?,?,?,?,?,?,1)",
                username, hash, role, orgId, coachId, athleteId);
    }

    protected int sport(int org, String name) { return insert("INSERT INTO sport (organization_id, sport_name) VALUES (?,?)", org, name); }

    protected int coach(int org, String first, String last) {
        return insert("INSERT INTO coach (organization_id, first_name, last_name, specialty, email, phone, hire_date) VALUES (?,?,?,?,?,?,?)",
                org, first, last, "Football", first.toLowerCase() + "." + last.toLowerCase() + "@test.example", "0200000000", LocalDate.of(2020, 1, 1));
    }

    protected int team(int org, String name, int sportId, int coachId) {
        return insert("INSERT INTO team (organization_id, team_name, sport_id, coach_id) VALUES (?,?,?,?)", org, name, sportId, coachId);
    }

    protected int athlete(int org, String first, String last) {
        return insert("INSERT INTO athlete (organization_id, first_name, last_name, date_of_birth, gender, phone, join_date) VALUES (?,?,?,?,?,?,?)",
                org, first, last, LocalDate.of(2002, 5, 5), "Male", "0240000000", LocalDate.now().minusYears(1));
    }

    protected int membershipType(int org, String name, double fee, int months) {
        return insert("INSERT INTO membership_type (organization_id, type_name, fee, duration_months) VALUES (?,?,?,?)", org, name, fee, months);
    }

    protected int membership(int org, int athleteId, int typeId, LocalDate start, LocalDate end, double charged, String status) {
        return insert("INSERT INTO membership (organization_id, athlete_id, type_id, start_date, end_date, amount_charged, status) VALUES (?,?,?,?,?,?,?)",
                org, athleteId, typeId, start, end, charged, status);
    }

    protected void roster(int org, int teamId, int athleteId, boolean active) {
        insert("INSERT INTO team_roster (organization_id, team_id, athlete_id, date_joined, position, is_active) VALUES (?,?,?,?,?,?)",
                org, teamId, athleteId, LocalDate.now().minusMonths(3), "Player", active);
    }

    protected int competition(int org, String name, LocalDate date, LocalDate deadline) {
        return insert("INSERT INTO competition (organization_id, comp_name, comp_date, venue, level, registration_deadline) VALUES (?,?,?,?,?,?)",
                org, name, date, "Test Ground", "Local", deadline);
    }

    protected void registerTeam(int org, int teamId, int competitionId) {
        insert("INSERT INTO team_competition (organization_id, team_id, competition_id, registration_date) VALUES (?,?,?,?)", org, teamId, competitionId, LocalDate.now().minusDays(20));
    }

    protected int facility(int org, String name, String status) {
        return insert("INSERT INTO facility (organization_id, facility_name, facility_type, capacity, status) VALUES (?,?,?,?,?)", org, name, "Field", 50, status);
    }

    protected int payment(int org, int membershipId, double amount, String status, LocalDate date) {
        return insert("INSERT INTO payment (organization_id, membership_id, amount, payment_date, method, status) VALUES (?,?,?,?,?,?)",
                org, membershipId, amount, date.atTime(10, 0), "Cash", status);
    }

    // ---------------------------------------------------------------- requests

    protected static final MediaType JSON = MediaType.APPLICATION_JSON;

    /** Signs in through the real login endpoint and returns the session for later requests. */
    protected MockHttpSession login(String username) { return login(username, PASSWORD); }

    protected MockHttpSession login(String username, String password) {
        try {
            MvcResult r = mvc.perform(post("/api/auth/login").with(csrf()).contentType(JSON)
                    .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                    .andExpect(status().isOk()).andReturn();
            return (MockHttpSession) r.getRequest().getSession(false);
        } catch (Exception e) {
            throw new AssertionError("Login failed for " + username, e);
        }
    }

    protected ResultActions send(MockHttpServletRequestBuilder request) {
        try { return mvc.perform(request); } catch (Exception e) { throw new AssertionError(e); }
    }

    protected ResultActions getAs(MockHttpSession s, String url) { return send(get(url).session(s)); }

    protected ResultActions postAs(MockHttpSession s, String url, String body) { return send(post(url).session(s).with(csrf()).contentType(JSON).content(body)); }

    protected ResultActions putAs(MockHttpSession s, String url, String body) { return send(put(url).session(s).with(csrf()).contentType(JSON).content(body)); }

    protected ResultActions deleteAs(MockHttpSession s, String url) { return send(delete(url).session(s).with(csrf())); }

    protected int statusOf(ResultActions r) { return r.andReturn().getResponse().getStatus(); }
}
