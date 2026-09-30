package com.dev.sports_club.demo;

import com.dev.sports_club.security.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/**
 * Fills a database with one realistic organization ("Accra Lions Academy") for investor demos and screenshots.
 *
 * Only runs when app.demo.seed=true, and only if the organization does not already exist, so restarting is safe.
 * Every date is worked out from today, so memberships expire, matches are upcoming and charts have a recent
 * history no matter when the demo is set up. The random source is seeded, so the data is the same each time.
 *
 * The data is built to tell a story, not just to fill tables: revenue grows month on month, a handful of athletes
 * are drifting away (falling attendance, membership about to end), a few have lapsed, and three payment oddities
 * are planted for the anomaly detector. It writes with plain SQL and does not go through the tenant filter,
 * because it runs before anyone is signed in. Demo accounts get one shared password: DEMO_PASSWORD if set,
 * otherwise a random one that is printed once to the log.
 */
@Component
@ConditionalOnProperty(name = "app.demo.seed", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String ORG_NAME = "Accra Lions Academy";
    public static final String ORG_SLUG = "accra-lions-academy";
    public static final String ADMIN = "demo.admin";
    public static final String FRONT_DESK = "demo.frontdesk";
    public static final String COACH = "demo.coach";
    public static final String ATHLETE = "demo.athlete";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** What was created, for the log and for tests. */
    public record Summary(int organizationId, int athletes, int memberships, int payments, int sessions, int attendance, int fixtures,
                          int bookings, int atRiskDrifting, int lapsed) { }

    private record TeamSpec(String name, int sport, int ageMin, int ageMax, char gender, int weight, int coach, DayOfWeek d1, DayOfWeek d2, int hour, int facility) { }

    private record Span(LocalDate start, LocalDate end) { }

    private enum State { ACTIVE, DRIFTING, LAPSED }

    private static final String[] SPORTS = {"Football", "Basketball", "Athletics", "Volleyball"};
    private static final String[][] COACHES = {
            {"Kwame", "Asante", "Football"}, {"Ama", "Owusu", "Football"}, {"Yaw", "Boateng", "Basketball"},
            {"Efua", "Mensah", "Athletics"}, {"Kofi", "Adjei", "Volleyball"}, {"Abena", "Sarpong", "Football"}};
    private static final String[] MALE = {"Kwame", "Kofi", "Yaw", "Kwesi", "Kojo", "Nana", "Femi", "Daniel", "Samuel", "Emmanuel", "Joseph", "Isaac", "Prince", "Michael", "Ebo", "Selorm", "Mawuli", "Elikem", "Fiifi", "Kelvin"};
    private static final String[] FEMALE = {"Ama", "Abena", "Akosua", "Efua", "Adwoa", "Esi", "Yaa", "Afia", "Naa", "Serwaa", "Grace", "Mercy", "Comfort", "Priscilla", "Linda", "Gifty", "Bernice", "Dorcas", "Joyce", "Vida"};
    private static final String[] SURNAMES = {"Mensah", "Asante", "Owusu", "Boateng", "Agyeman", "Adjei", "Osei", "Appiah", "Amoah", "Tetteh", "Quaye", "Addo", "Ofori", "Sarpong", "Darko", "Acheampong", "Antwi", "Bonsu", "Lartey", "Danso", "Yeboah", "Ansah", "Kyei", "Ampofo"};
    private static final String[] METHODS = {"Mobile Money", "Mobile Money", "Mobile Money", "Mobile Money", "Mobile Money", "Cash", "Cash", "Card", "Card", "Bank Transfer"};
    private static final String[][] POSITIONS = {
            {"Goalkeeper", "Defender", "Midfielder", "Winger", "Striker"}, {"Point Guard", "Shooting Guard", "Forward", "Centre"},
            {"Sprinter", "Middle Distance", "Jumper", "Thrower"}, {"Setter", "Outside Hitter", "Middle Blocker", "Libero"}};

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final TransactionTemplate tx;
    private final String configuredPassword;

    public DemoDataSeeder(JdbcTemplate jdbc, PasswordEncoder encoder, TransactionTemplate tx, @Value("${app.demo.password:}") String configuredPassword) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.tx = tx;
        this.configuredPassword = configuredPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM organization WHERE slug = ?", Integer.class, ORG_SLUG);
        if (existing != null && existing > 0) {
            log.info("Demo organization '{}' already exists; nothing to seed.", ORG_NAME);
            return;
        }
        boolean generated = configuredPassword == null || configuredPassword.isBlank();
        String password = generated ? generatePassword() : configuredPassword;
        Summary s = seed(password);
        log.warn("Seeded demo organization '{}': {} athletes, {} memberships, {} payments, {} sessions, {} fixtures.",
                ORG_NAME, s.athletes(), s.memberships(), s.payments(), s.sessions(), s.fixtures());
        log.warn("Demo accounts: {}, {}, {}, {}  (Admin, Front Desk, Coach, Athlete){}", ADMIN, FRONT_DESK, COACH, ATHLETE,
                generated ? "  Password for all of them: " + password : "  Password: the value of app.demo.password");
    }

    public Summary seed(String password) {
        PasswordPolicy.validate(password, ADMIN);
        return tx.execute(status -> build(password));
    }

    // ================================================================ the data

    private Summary build(String password) {
        Random r = new Random(20260930L);
        LocalDate today = LocalDate.now();
        String hash = encoder.encode(password);

        int org = insert("INSERT INTO organization (name, slug, plan, status) VALUES (?, ?, 'Professional', 'Active')", ORG_NAME, ORG_SLUG);

        int[] sport = new int[SPORTS.length];
        for (int i = 0; i < SPORTS.length; i++) sport[i] = insert("INSERT INTO sport (organization_id, sport_name, description) VALUES (?,?,?)", org, SPORTS[i], "Club " + SPORTS[i].toLowerCase());

        int[] coach = new int[COACHES.length];
        for (int i = 0; i < COACHES.length; i++) {
            String[] c = COACHES[i];
            coach[i] = insert("INSERT INTO coach (organization_id, first_name, last_name, specialty, email, phone, hire_date) VALUES (?,?,?,?,?,?,?)",
                    org, c[0], c[1], c[2], c[0].toLowerCase() + "." + c[1].toLowerCase() + "@lions.example", "0244" + (100000 + r.nextInt(899999)), today.minusYears(2 + i % 4).minusDays(r.nextInt(300)));
        }

        String[] typeNames = {"Monthly", "Quarterly", "Annual", "Student Monthly"};
        double[] fees = {120, 300, 1000, 80};
        int[] months = {1, 3, 12, 1};
        int[] typeId = new int[4];
        for (int i = 0; i < 4; i++) typeId[i] = insert("INSERT INTO membership_type (organization_id, type_name, fee, duration_months, description) VALUES (?,?,?,?,?)", org, typeNames[i], fees[i], months[i], typeNames[i] + " membership");

        TeamSpec[] specs = {
                new TeamSpec("Lions U17", 0, 14, 17, 'M', 12, 0, DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, 16, 0),
                new TeamSpec("Lions Seniors", 0, 18, 32, 'M', 12, 1, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, 16, 0),
                new TeamSpec("Lions Women", 0, 17, 30, 'F', 10, 5, DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, 18, 0),
                new TeamSpec("Court Kings", 1, 18, 30, 'M', 9, 2, DayOfWeek.TUESDAY, DayOfWeek.THURSDAY, 18, 2),
                new TeamSpec("Court Queens", 1, 17, 28, 'F', 8, 2, DayOfWeek.MONDAY, DayOfWeek.FRIDAY, 18, 2),
                new TeamSpec("Sprint Squad", 2, 16, 30, 'X', 7, 3, DayOfWeek.TUESDAY, DayOfWeek.SATURDAY, 8, 3),
                new TeamSpec("Spikers", 3, 17, 30, 'X', 6, 4, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY, 16, 2),
                new TeamSpec("Lions U13", 0, 10, 13, 'X', 6, 5, DayOfWeek.SATURDAY, DayOfWeek.WEDNESDAY, 8, 1)};
        int[] team = new int[specs.length];
        for (int i = 0; i < specs.length; i++) {
            team[i] = insert("INSERT INTO team (organization_id, team_name, sport_id, coach_id, founded_date) VALUES (?,?,?,?,?)",
                    org, specs[i].name(), sport[specs[i].sport()], coach[specs[i].coach()], today.minusYears(3).minusDays(i * 40L));
        }
        int totalWeight = Arrays.stream(specs).mapToInt(TeamSpec::weight).sum();

        // ---------------------------------------------------------------- athletes, memberships, payments
        final int athleteCount = 72;
        List<Integer> order = new ArrayList<>();
        for (int i = 0; i < athleteCount; i++) order.add(i);
        Collections.shuffle(order, r);
        State[] state = new State[athleteCount];
        Arrays.fill(state, State.ACTIVE);
        for (int k = 0; k < 8; k++) state[order.get(k)] = State.LAPSED;
        for (int k = 8; k < 19; k++) state[order.get(k)] = State.DRIFTING;
        Set<Integer> planted = new LinkedHashSet<>();   // three active athletes whose current membership is left unpaid for the anomaly stories
        for (int k = 19; k < athleteCount && planted.size() < 3; k++) planted.add(order.get(k));

        int[] athleteId = new int[athleteCount];
        int[] athleteTeam = new int[athleteCount];
        LocalDate[] joined = new LocalDate[athleteCount];
        LocalDate[] lapsedOn = new LocalDate[athleteCount];
        int[] currentMembership = new int[athleteCount];
        double[] currentFee = new double[athleteCount];
        int membershipCount = 0, paymentCount = 0, refSeq = 1000;

        for (int i = 0; i < athleteCount; i++) {
            int t = pickTeam(r, specs, totalWeight);
            TeamSpec spec = specs[t];
            boolean female = spec.gender() == 'F' || (spec.gender() == 'X' && r.nextBoolean());
            String first = (female ? FEMALE : MALE)[r.nextInt(20)];
            String last = SURNAMES[r.nextInt(SURNAMES.length)];
            LocalDate dob = today.minusYears(r.nextInt(spec.ageMin(), spec.ageMax() + 1)).minusDays(r.nextInt(360));

            // A mix of plans. Monthly and quarterly dominate, with a few annual, so revenue moves fairly smoothly.
            int planRoll = r.nextInt(100);
            int ty = planRoll < 32 ? 0 : planRoll < 47 ? 3 : planRoll < 82 ? 1 : 2;
            int dur = months[ty];
            LocalDate end = switch (state[i]) {
                case ACTIVE -> today.plusDays(r.nextInt(2, dur * 30));
                case DRIFTING -> today.plusDays(r.nextInt(3, 23));
                case LAPSED -> today.minusDays(r.nextInt(8, 76));
            };
            LocalDate wantedJoin = today.minusMonths((long) Math.floor(20 * Math.pow(r.nextDouble(), 2.0)));
            LinkedList<Span> chain = new LinkedList<>();
            chain.add(new Span(end.minusMonths(dur), end));
            while (chain.getFirst().start().isAfter(wantedJoin)) {
                LocalDate prevEnd = chain.getFirst().start().minusDays(r.nextInt(0, 3));
                chain.addFirst(new Span(prevEnd.minusMonths(dur), prevEnd));
            }
            joined[i] = chain.getFirst().start();
            if (state[i] == State.LAPSED) lapsedOn[i] = end;

            athleteId[i] = insert("INSERT INTO athlete (organization_id, first_name, last_name, date_of_birth, gender, email, phone, join_date) VALUES (?,?,?,?,?,?,?,?)",
                    org, first, last, dob, female ? "Female" : "Male", first.toLowerCase() + "." + last.toLowerCase() + i + "@example.com", (r.nextBoolean() ? "024" : "055") + (1000000 + r.nextInt(8999999)), joined[i]);
            athleteTeam[i] = t;

            for (int k = 0; k < chain.size(); k++) {
                Span s = chain.get(k);
                boolean current = k == chain.size() - 1 && !s.end().isBefore(today);
                int m = insert("INSERT INTO membership (organization_id, athlete_id, type_id, start_date, end_date, amount_charged, status) VALUES (?,?,?,?,?,?,?)",
                        org, athleteId[i], typeId[ty], s.start(), s.end(), fees[ty], s.end().isBefore(today) ? "Expired" : "Active");
                membershipCount++;
                if (k == chain.size() - 1) { currentMembership[i] = m; currentFee[i] = fees[ty]; }

                double roll = r.nextDouble();
                boolean unpaid = current && (planted.contains(i) || roll < 0.05);
                if (unpaid) continue;
                if (current && roll < 0.11) {
                    paymentCount += payment(org, m, fees[ty], "Pending", today.minusDays(r.nextInt(0, 4)), METHODS[r.nextInt(METHODS.length)], "LA-" + (++refSeq), r);
                } else if (!current && roll > 0.985) {
                    paymentCount += payment(org, m, fees[ty], "Refunded", min(today, s.start().plusDays(1)), METHODS[r.nextInt(METHODS.length)], "LA-" + (++refSeq), r);
                } else if (fees[ty] >= 300 && r.nextDouble() < 0.1) {
                    double first60 = Math.round(fees[ty] * 0.6 * 100) / 100.0;
                    paymentCount += payment(org, m, first60, "Completed", min(today, s.start()), METHODS[r.nextInt(METHODS.length)], "LA-" + (++refSeq), r);
                    paymentCount += payment(org, m, fees[ty] - first60, "Completed", min(today, s.start().plusDays(r.nextInt(5, 21))), METHODS[r.nextInt(METHODS.length)], "LA-" + (++refSeq), r);
                } else {
                    paymentCount += payment(org, m, fees[ty], "Completed", min(today, s.start().plusDays(r.nextInt(0, 3))), METHODS[r.nextInt(METHODS.length)], "LA-" + (++refSeq), r);
                }
            }

            int sportIdx = spec.sport();
            insert("INSERT INTO team_roster (organization_id, team_id, athlete_id, date_joined, position, is_active) VALUES (?,?,?,?,?,?)",
                    org, team[t], athleteId[i], joined[i], POSITIONS[sportIdx][r.nextInt(POSITIONS[sportIdx].length)], !(i % 23 == 5));  // a lapsed member usually stays on the team list until someone tidies it
        }

        // ---------------------------------------------------------------- three payment stories for the anomaly detector
        List<Integer> stories = new ArrayList<>(planted);
        int dupA = stories.get(0), failA = stories.get(1), staleA = stories.get(2);
        double quarter = Math.round(currentFee[dupA] * 25) / 100.0;
        paymentCount += payment(org, currentMembership[dupA], quarter, "Completed", today.minusDays(1), "Mobile Money", "LA-" + (++refSeq), r, 10, 5);
        paymentCount += payment(org, currentMembership[dupA], quarter, "Completed", today.minusDays(1), "Mobile Money", "LA-" + (++refSeq), r, 14, 20);
        paymentCount += payment(org, currentMembership[failA], currentFee[failA], "Failed", today.minusDays(4), "Card", "LA-" + (++refSeq), r);
        paymentCount += payment(org, currentMembership[failA], currentFee[failA], "Failed", today.minusDays(2), "Card", "LA-" + (++refSeq), r);
        paymentCount += payment(org, currentMembership[staleA], currentFee[staleA], "Pending", today.minusDays(25), "Bank Transfer", "LA-" + (++refSeq), r);

        // ---------------------------------------------------------------- training sessions and attendance
        int sessionCount = 0;
        List<Object[]> attendanceRows = new ArrayList<>();
        double[] propensity = new double[athleteCount];
        for (int i = 0; i < athleteCount; i++) propensity[i] = 0.62 + 0.33 * r.nextDouble();
        Set<String> booked = new HashSet<>();
        List<Object[]> bookingRows = new ArrayList<>();
        int[] facility = facilities(org);
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        for (int t = 0; t < specs.length; t++) {
            TeamSpec spec = specs[t];
            for (int w = -12; w <= 2; w++) {
                for (DayOfWeek dow : new DayOfWeek[]{spec.d1(), spec.d2()}) {
                    LocalDate d = monday.plusWeeks(w).with(dow);
                    boolean past = d.isBefore(today);
                    if (d.isBefore(today.minusDays(84))) continue;
                    if (past) {
                        int session = insert("INSERT INTO training_session (organization_id, team_id, session_date, start_time, location, notes) VALUES (?,?,?,?,?,?)",
                                org, team[t], d, LocalTime.of(spec.hour(), 0), "Club grounds", null);
                        sessionCount++;
                        for (int i = 0; i < athleteCount; i++) {
                            if (athleteTeam[i] != t || d.isBefore(joined[i]) || (lapsedOn[i] != null && d.isAfter(lapsedOn[i]))) continue;
                            double p = state[i] == State.DRIFTING && d.isAfter(today.minusDays(42)) ? 0.28 : propensity[i];
                            String status = r.nextDouble() < p ? (r.nextDouble() < 0.15 ? "Late" : "Present") : (r.nextDouble() < 0.7 ? "Absent" : "Excused");
                            attendanceRows.add(new Object[]{session, athleteId[i], org, status});
                        }
                    }
                    int f = facility[spec.facility() == 0 ? (t % 2 == 0 ? 0 : 1) : spec.facility()];
                    String slot = String.format("%02d:00-%02d:00", spec.hour(), spec.hour() + 2);
                    if (booked.add(f + "|" + d + "|" + slot)) {
                        bookingRows.add(new Object[]{org, f, team[t], d, slot, "Training", past && r.nextDouble() < 0.08 ? "Cancelled" : "Confirmed"});
                    }
                }
            }
        }
        jdbc.batchUpdate("INSERT INTO attendance (session_id, athlete_id, organization_id, status) VALUES (?,?,?,?)", attendanceRows);
        // Open sessions, hires and conditioning on top of the team training: busiest in the evenings, quieter at midday and weekends.
        int[] hours = {6, 8, 10, 12, 14, 16, 18, 20};
        double[] peak = {0.10, 0.25, 0.25, 0.10, 0.20, 0.55, 0.60, 0.20};
        double[] popularity = {0.9, 0.6, 0.9, 0.6, 0.7};           // main pitch, pitch B, arena, track, gym
        int[][] teamsFor = {{0, 1, 2, 7}, {0, 7, 1}, {3, 4, 6}, {5}, {0, 1, 3, 4, 5, 6}};
        String[] purposes = {"Open session", "Match practice", "Conditioning", "Team hire"};
        for (int d = -56; d <= 10; d++) {
            LocalDate date = today.plusDays(d);
            double weekend = date.getDayOfWeek().getValue() >= 6 ? 0.6 : 1.0;
            for (int f = 0; f < popularity.length; f++) {
                for (int h = 0; h < hours.length; h++) {
                    if (r.nextDouble() >= peak[h] * popularity[f] * weekend) continue;
                    String slot = String.format("%02d:00-%02d:00", hours[h], hours[h] + 2);
                    if (!booked.add(facility[f] + "|" + date + "|" + slot)) continue;
                    int[] pool = teamsFor[f];
                    bookingRows.add(new Object[]{org, facility[f], team[pool[r.nextInt(pool.length)]], date, slot, purposes[r.nextInt(purposes.length)],
                            d < 0 && r.nextDouble() < 0.06 ? "Cancelled" : "Confirmed"});
                }
            }
        }
        jdbc.batchUpdate("INSERT INTO facility_booking (organization_id, facility_id, team_id, booking_date, time_slot, purpose, status) VALUES (?,?,?,?,?,?,?)", bookingRows);

        // ---------------------------------------------------------------- performance records
        for (int i = 0; i < athleteCount; i++) {
            int sportIdx = specs[athleteTeam[i]].sport();
            double base = 52 + r.nextInt(30);
            double slope = state[i] == State.DRIFTING ? -2.2 : r.nextInt(5) == 0 ? 2.4 : -0.3 + r.nextDouble() * 1.6;
            for (int k = 0; k < 8; k++) {
                LocalDate d = today.minusDays(84 - k * 11L);
                if (d.isBefore(joined[i].plusDays(7)) || (lapsedOn[i] != null && d.isAfter(lapsedOn[i]))) continue;
                double rating = Math.max(30, Math.min(98, base + slope * k + r.nextGaussian() * 3));
                jdbc.update("INSERT INTO performance_record (organization_id, athlete_id, record_date, rating, stats, notes) VALUES (?,?,?,?,?,?)",
                        org, athleteId[i], d, Math.round(rating * 10) / 10.0, stats(sportIdx, r), null);
            }
        }

        // ---------------------------------------------------------------- competitions and fixtures
        int fixtures = competitions(org, team, r, today);

        // ---------------------------------------------------------------- events
        Object[][] events = {
                {"Season Kick-off", "ClubEvent", -90, "Completed", "Club grounds"}, {"Coaches Workshop: Youth Development", "Workshop", -40, "Completed", "Club Hall"},
                {"Club Fun Run", "ClubEvent", -14, "Completed", "Sprint Track"}, {"Parents Meeting", "TeamMeeting", 5, "Scheduled", "Club Hall"},
                {"Open Trials Day", "Training", 12, "Scheduled", "Main Pitch"}, {"Awards Night", "Awards", 30, "Scheduled", "Club Hall"}};
        for (Object[] e : events) {
            jdbc.update("INSERT INTO club_event (organization_id, title, event_type, event_date, start_time, end_time, location, organizer, status) VALUES (?,?,?,?,?,?,?,?,?)",
                    org, e[0], e[1], today.plusDays((Integer) e[2]), LocalTime.of(15, 0), LocalTime.of(17, 30), e[4], "Club office", e[3]);
        }

        // ---------------------------------------------------------------- accounts
        int showcase = 0;
        for (int i = 0; i < athleteCount; i++) {
            if (state[i] == State.ACTIVE && !planted.contains(i) && athleteTeam[i] == 1 && joined[i].isBefore(today.minusMonths(6))) { showcase = i; break; }
        }
        insert("INSERT INTO app_user (username, password_hash, role, organization_id, is_active) VALUES (?,?,?,?,1)", ADMIN, hash, "Admin", org);
        insert("INSERT INTO app_user (username, password_hash, role, organization_id, is_active) VALUES (?,?,?,?,1)", FRONT_DESK, hash, "FrontDesk", org);
        insert("INSERT INTO app_user (username, password_hash, role, organization_id, coach_id, is_active) VALUES (?,?,?,?,?,1)", COACH, hash, "Coach", org, coach[0]);
        insert("INSERT INTO app_user (username, password_hash, role, organization_id, athlete_id, is_active) VALUES (?,?,?,?,?,1)", ATHLETE, hash, "Athlete", org, athleteId[showcase]);
        int adminId = jdbc.queryForObject("SELECT user_id FROM app_user WHERE username = ?", Integer.class, ADMIN);
        String[][] notes = {{"membership", "9 memberships end within 3 weeks. A renewal reminder now avoids lapses.", "/memberships"},
                {"payment", "Repeated failed payments on one membership in the last 30 days.", "/intelligence"},
                {"event", "Awards Night is 30 days away.", "/events"}};
        for (int n = 0; n < notes.length; n++) {
            jdbc.update("INSERT INTO notification (user_id, organization_id, kind, message, link, dedupe_key, is_read) VALUES (?,?,?,?,?,?,0)", adminId, org, notes[n][0], notes[n][1], notes[n][2], "demo:" + n);
        }

        int sessions = sessionCount;
        return new Summary(org, athleteCount, membershipCount, count("payment", org), sessions, attendanceRows.size(), fixtures, bookingRows.size(),
                (int) Arrays.stream(state).filter(s -> s == State.DRIFTING).count(), (int) Arrays.stream(state).filter(s -> s == State.LAPSED).count());
    }

    private int[] facilities(int org) {
        Object[][] f = {{"Main Pitch", "Field", 300, "Available"}, {"Training Pitch B", "Field", 150, "Available"}, {"Indoor Arena", "Court", 120, "Available"},
                {"Sprint Track", "Track", 200, "Available"}, {"Fitness Centre", "Gym", 60, "Available"}, {"Club Hall", "Hall", 150, "Maintenance"}};
        int[] ids = new int[f.length];
        for (int i = 0; i < f.length; i++) {
            ids[i] = insert("INSERT INTO facility (organization_id, facility_name, facility_type, capacity, location, status) VALUES (?,?,?,?,?,?)", org, f[i][0], f[i][1], f[i][2], "Accra", f[i][3]);
        }
        return ids;
    }

    /** A league in progress, a finished knockout cup, a competition with registration open, and one nobody has entered yet. */
    private int competitions(int org, int[] team, Random r, LocalDate today) {
        int league = insert("INSERT INTO competition (organization_id, comp_name, comp_date, venue, level, registration_deadline) VALUES (?,?,?,?,?,?)",
                org, "Accra Youth League", today.minusDays(49), "Main Pitch", "Regional", today.minusDays(70));
        int cup = insert("INSERT INTO competition (organization_id, comp_name, comp_date, venue, level, registration_deadline) VALUES (?,?,?,?,?,?)",
                org, "Independence Day Cup", today.minusMonths(6), "Accra Sports Stadium", "National", today.minusMonths(6).minusDays(21));
        int classic = insert("INSERT INTO competition (organization_id, comp_name, comp_date, venue, level, registration_deadline) VALUES (?,?,?,?,?,?)",
                org, "Greater Accra Basketball Classic", today.plusDays(35), "Indoor Arena", "Regional", today.plusDays(14));
        insert("INSERT INTO competition (organization_id, comp_name, comp_date, venue, level, registration_deadline) VALUES (?,?,?,?,?,?)",
                org, "West Africa Sprint Meet", today.plusDays(75), "Legon Track", "International", today.plusDays(50));

        int[] football = {team[0], team[1], team[2], team[7]};
        for (int t : football) {
            insert("INSERT INTO team_competition (organization_id, team_id, competition_id, registration_date) VALUES (?,?,?,?)", org, t, league, today.minusDays(72));
        }
        int[] cupPos = {3, 1, 2, 4}; // U17, Seniors, Women, U13
        for (int i = 0; i < football.length; i++) {
            jdbc.update("INSERT INTO team_competition (organization_id, team_id, competition_id, registration_date, final_position) VALUES (?,?,?,?,?)", org, football[i], cup, today.minusMonths(6).minusDays(25), cupPos[i]);
        }
        for (int t : new int[]{team[3], team[4]}) {
            insert("INSERT INTO team_competition (organization_id, team_id, competition_id, registration_date) VALUES (?,?,?,?)", org, t, classic, today.minusDays(3));
        }

        int fixtures = 0;
        int i = 0;
        Map<Integer, Integer> points = new HashMap<>();
        for (int leg = 0; leg < 2; leg++) {
            for (int a = 0; a < football.length; a++) {
                for (int b = a + 1; b < football.length; b++) {
                    int home = leg == 0 ? football[a] : football[b], away = leg == 0 ? football[b] : football[a];
                    boolean played = i < 8;
                    LocalDate date = played ? today.minusDays(49 - i * 6L) : today.plusDays(3 + (i - 8) * 7L);
                    if (played) {
                        int hs = r.nextInt(4), as = r.nextInt(3);
                        insert("INSERT INTO fixture (organization_id, competition_id, home_team_id, away_team_id, round_label, venue, match_date, match_time, status, home_score, away_score) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                                org, league, home, away, "Group Stage", "Main Pitch", date, LocalTime.of(15, 0), "Completed", hs, as);
                        points.merge(home, hs > as ? 3 : hs == as ? 1 : 0, Integer::sum);
                        points.merge(away, as > hs ? 3 : hs == as ? 1 : 0, Integer::sum);
                    } else {
                        insert("INSERT INTO fixture (organization_id, competition_id, home_team_id, away_team_id, round_label, venue, match_date, match_time, status) VALUES (?,?,?,?,?,?,?,?,?)",
                                org, league, home, away, "Group Stage", "Main Pitch", date, LocalTime.of(15, 0), "Scheduled");
                    }
                    fixtures++;
                    i++;
                }
            }
        }
        for (int t : football) {
            jdbc.update("UPDATE team_competition SET points_scored = ? WHERE team_id = ? AND competition_id = ?", points.getOrDefault(t, 0), t, league);
        }

        LocalDate cupDay = today.minusMonths(6);
        Object[][] cupGames = {{football[1], football[3], 2, 1, "Semi-final", 0}, {football[0], football[2], 0, 1, "Semi-final", 0}, {football[1], football[2], 1, 0, "Final", 3}};
        for (Object[] g : cupGames) {
            insert("INSERT INTO fixture (organization_id, competition_id, home_team_id, away_team_id, round_label, venue, match_date, match_time, status, home_score, away_score) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    org, cup, g[0], g[1], g[4], "Accra Sports Stadium", cupDay.plusDays((Integer) g[5]), LocalTime.of(16, 0), "Completed", g[2], g[3]);
            fixtures++;
        }
        return fixtures;
    }

    // ================================================================ helpers

    private int pickTeam(Random r, TeamSpec[] specs, int total) {
        int roll = r.nextInt(total);
        for (int i = 0; i < specs.length; i++) { roll -= specs[i].weight(); if (roll < 0) return i; }
        return 0;
    }

    private static String stats(int sport, Random r) {
        return switch (sport) {
            case 0 -> String.format("{\"goals\":%d,\"assists\":%d}", r.nextInt(3), r.nextInt(3));
            case 1 -> String.format("{\"points\":%d,\"rebounds\":%d}", 4 + r.nextInt(20), r.nextInt(10));
            case 2 -> String.format("{\"personal_bests\":%d}", r.nextInt(2));
            default -> String.format("{\"spikes\":%d,\"blocks\":%d}", r.nextInt(14), r.nextInt(5));
        };
    }

    private static LocalDate min(LocalDate a, LocalDate b) { return a.isBefore(b) ? a : b; }

    private int payment(int org, int membership, double amount, String status, LocalDate date, String method, String ref, Random r) {
        return payment(org, membership, amount, status, date, method, ref, r, 8 + r.nextInt(10), r.nextInt(60));
    }

    private int payment(int org, int membership, double amount, String status, LocalDate date, String method, String ref, Random r, int hour, int minute) {
        insert("INSERT INTO payment (organization_id, membership_id, amount, payment_date, method, status, reference_no) VALUES (?,?,?,?,?,?,?)",
                org, membership, amount, date.atTime(hour, minute), method, status, ref);
        return 1;
    }

    private int count(String table, int org) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE organization_id = ?", Integer.class, org);
        return n == null ? 0 : n;
    }

    private int insert(String sql, Object... args) {
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps;
        }, keys);
        Number key = keys.getKey();
        return key == null ? 0 : key.intValue();
    }

    private static String generatePassword() {
        SecureRandom sr = new SecureRandom();
        String letters = "abcdefghjkmnpqrstuvwxyz", digits = "23456789";
        StringBuilder sb = new StringBuilder("Lions-");
        for (int i = 0; i < 4; i++) sb.append(digits.charAt(sr.nextInt(digits.length())));
        sb.append('-');
        for (int i = 0; i < 6; i++) sb.append(letters.charAt(sr.nextInt(letters.length())));
        return sb.toString();
    }
}
