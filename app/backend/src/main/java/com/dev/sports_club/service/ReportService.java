package com.dev.sports_club.service;

import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.report.ReportData;
import com.dev.sports_club.report.ReportData.Stat;
import com.dev.sports_club.repository.OrganizationRepository;
import com.dev.sports_club.service.DataSnapshot.Snapshot;
import com.dev.sports_club.service.DataSnapshot.Snapshot.Mark;
import com.dev.sports_club.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/** Builds the seven reports for a date range. Athlete-level reports respect what the caller may see. */
@Service
@RequiredArgsConstructor
public class ReportService {

    /** Which roles may run which reports (Admin and Super Admin may run all). */
    public static final Map<String, Set<String>> ACCESS = Map.of(
            "athletes", Set.of("FrontDesk"),
            "memberships", Set.of("FrontDesk"),
            "financial", Set.of("FrontDesk"),
            "attendance", Set.of("Coach"),
            "performance", Set.of("Coach"),
            "facilities", Set.of(),
            "competitions", Set.of());

    private final DataSnapshot data;
    private final AccessScope scope;
    private final OrganizationRepository organizationRepository;

    public static boolean known(String type) { return ACCESS.containsKey(type); }

    public static boolean allowed(String type, Collection<String> roles) {
        if (roles.contains("Admin") || roles.contains("SuperAdmin")) return true;
        return roles.stream().anyMatch(r -> ACCESS.getOrDefault(type, Set.of()).contains(r));
    }

    @Transactional(readOnly = true)
    public ReportData build(String type, LocalDate fromParam, LocalDate toParam, Integer teamId) {
        if (!known(type)) throw new BusinessRuleViolationException("Unknown report: " + type);
        LocalDate to = toParam != null ? toParam : LocalDate.now();
        LocalDate from = fromParam != null ? fromParam : to.minusDays(29);
        if (from.isAfter(to)) throw new BusinessRuleViolationException("The start date must be on or before the end date");
        if (ChronoUnit.DAYS.between(from, to) > 1830) throw new BusinessRuleViolationException("Choose a range of at most 5 years");

        Snapshot s = data.load();
        String org = TenantContext.hasOrganization()
                ? organizationRepository.findById(TenantContext.get()).map(Organization::getName).orElse("Organization") : "Organization";
        Ctx c = new Ctx(s, from, to, teamId, scope.current());
        return switch (type) {
            case "athletes" -> athletes(c, org);
            case "memberships" -> memberships(c, org);
            case "financial" -> financial(c, org);
            case "attendance" -> attendance(c, org);
            case "performance" -> performance(c, org);
            case "facilities" -> facilities(c, org);
            default -> competitions(c, org);
        };
    }

    private record Ctx(Snapshot s, LocalDate from, LocalDate to, Integer teamId, AccessScope.Visible visible) {
        boolean sees(Integer athleteId) { return visible.athlete(athleteId); }
    }

    private static ReportData report(String type, String title, String org, Ctx c, List<Stat> summary, List<String> columns, List<List<Object>> rows) {
        return new ReportData(type, title, org, c.from(), c.to(), LocalDateTime.now(), summary, columns, rows);
    }

    private static String money(double v) { return "GH₵" + String.format(Locale.ROOT, "%,.2f", v); }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    // ---------------------------------------------------------------- athletes
    private ReportData athletes(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Team> team = s.currentTeamByAthlete();
        Map<Integer, String> sport = s.sportNameByAthlete();
        Map<Integer, Membership> latest = s.latestMembershipByAthlete();
        Map<Integer, List<Mark>> marks = s.marksByAthlete();
        Map<Integer, TeamRoster> roster = new HashMap<>();
        s.activeRosters().forEach(r -> roster.put(r.getId().getAthleteId(), r));
        List<Athlete> list = s.athletes().stream().filter(a -> c.sees(a.getAthleteId()))
                .filter(a -> c.teamId() == null || (team.get(a.getAthleteId()) != null && team.get(a.getAthleteId()).getTeamId().equals(c.teamId())))
                .sorted(Comparator.comparing(Athlete::getLastName).thenComparing(Athlete::getFirstName)).toList();
        List<List<Object>> rows = new ArrayList<>();
        for (Athlete a : list) {
            List<Mark> m = marks.getOrDefault(a.getAthleteId(), List.of());
            Membership ms = latest.get(a.getAthleteId());
            rows.add(row(a.getAthleteId(), Snapshot.name(a), a.getGender().name(), (int) ChronoUnit.YEARS.between(a.getDateOfBirth(), c.to()),
                    sport.getOrDefault(a.getAthleteId(), ""), team.containsKey(a.getAthleteId()) ? team.get(a.getAthleteId()).getTeamName() : "",
                    roster.containsKey(a.getAthleteId()) && roster.get(a.getAthleteId()).getPosition() != null ? roster.get(a.getAthleteId()).getPosition() : "",
                    a.getJoinDate().toString(), ms == null ? "None" : ms.getStatus().name(),
                    m.isEmpty() ? "" : round1(m.stream().filter(Mark::attended).count() * 100.0 / m.size())));
        }
        long male = list.stream().filter(a -> a.getGender() == Gender.Male).count();
        double avgAge = list.stream().mapToLong(a -> ChronoUnit.YEARS.between(a.getDateOfBirth(), c.to())).average().orElse(0);
        return report("athletes", "Athlete report", org, c, List.of(new Stat("Athletes", String.valueOf(list.size())),
                        new Stat("Joined in period", String.valueOf(list.stream().filter(a -> Snapshot.between(a.getJoinDate(), c.from(), c.to())).count())),
                        new Stat("Male / Female", male + " / " + (list.size() - male)), new Stat("Average age", String.format(Locale.ROOT, "%.1f", avgAge))),
                List.of("ID", "Name", "Gender", "Age", "Sport", "Team", "Position", "Joined", "Membership", "Attendance %"), rows);
    }

    // ---------------------------------------------------------------- memberships
    private ReportData memberships(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, MembershipType> types = s.typeById();
        Map<Integer, BigDecimal> paid = s.paidByMembership();
        List<Membership> list = s.memberships().stream()
                .filter(m -> !m.getStartDate().isAfter(c.to()) && !m.getEndDate().isBefore(c.from()))
                .sorted(Comparator.comparing(Membership::getEndDate)).toList();
        double charged = 0, collected = 0, outstanding = 0;
        List<List<Object>> rows = new ArrayList<>();
        for (Membership m : list) {
            double pd = paid.getOrDefault(m.getMembershipId(), BigDecimal.ZERO).doubleValue();
            double ch = m.getAmountCharged().doubleValue();
            charged += ch;
            collected += pd;
            if (m.getStatus() == MembershipStatus.Active) outstanding += Math.max(0, ch - pd);
            Athlete a = athletes.get(m.getAthleteId());
            MembershipType t = types.get(m.getTypeId());
            rows.add(row(m.getMembershipId(), a != null ? Snapshot.name(a) : "Unknown", t != null ? t.getTypeName() : "", m.getStartDate().toString(),
                    m.getEndDate().toString(), ch, pd, Math.max(0, ch - pd), m.getStatus().name()));
        }
        return report("memberships", "Membership report", org, c, List.of(new Stat("Memberships", String.valueOf(list.size())),
                        new Stat("Active", String.valueOf(list.stream().filter(m -> m.getStatus() == MembershipStatus.Active).count())),
                        new Stat("Charged", money(charged)), new Stat("Outstanding", money(outstanding))),
                List.of("ID", "Athlete", "Plan", "Start", "End", "Charged (GHS)", "Paid (GHS)", "Balance (GHS)", "Status"), rows);
    }

    // ---------------------------------------------------------------- financial
    private ReportData financial(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Membership> memberships = s.memberships().stream().collect(Collectors.toMap(Membership::getMembershipId, m -> m));
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, MembershipType> types = s.typeById();
        List<Payment> list = s.payments().stream().filter(p -> Snapshot.between(p.getPaymentDate().toLocalDate(), c.from(), c.to()))
                .sorted(Comparator.comparing(Payment::getPaymentDate).reversed()).toList();
        double collected = 0, pending = 0, refunded = 0;
        List<List<Object>> rows = new ArrayList<>();
        for (Payment p : list) {
            double amt = p.getAmount().doubleValue();
            switch (p.getStatus()) { case Completed -> collected += amt; case Pending -> pending += amt; case Refunded -> refunded += amt; default -> { } }
            Membership m = memberships.get(p.getMembershipId());
            Athlete a = m != null ? athletes.get(m.getAthleteId()) : null;
            MembershipType t = m != null ? types.get(m.getTypeId()) : null;
            rows.add(row(p.getPaymentId(), p.getPaymentDate().toLocalDate().toString(), a != null ? Snapshot.name(a) : "Unknown", t != null ? t.getTypeName() : "",
                    AnalyticsService.methodLabel(p.getMethod()), amt, p.getStatus().name(), p.getReferenceNo() == null ? "" : p.getReferenceNo()));
        }
        return report("financial", "Financial report", org, c, List.of(new Stat("Collected", money(collected)), new Stat("Pending", money(pending)),
                        new Stat("Refunded", money(refunded)), new Stat("Transactions", String.valueOf(list.size()))),
                List.of("ID", "Date", "Athlete", "Plan", "Method", "Amount (GHS)", "Status", "Reference"), rows);
    }

    // ---------------------------------------------------------------- attendance
    private ReportData attendance(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, Team> teams = s.teamById();
        Map<Integer, List<Mark>> marks = s.marksByAthlete();
        Set<Integer> sessionsHeld = s.sessions().stream().filter(t -> Snapshot.between(t.getSessionDate(), c.from(), c.to()))
                .filter(t -> c.visible().team(t.getTeamId()) && (c.teamId() == null || c.teamId().equals(t.getTeamId()))).map(TrainingSession::getSessionId).collect(Collectors.toSet());
        List<List<Object>> rows = new ArrayList<>();
        long attendedAll = 0, totalAll = 0;
        for (Map.Entry<Integer, List<Mark>> e : marks.entrySet()) {
            Athlete a = athletes.get(e.getKey());
            if (a == null || !c.sees(a.getAthleteId())) continue;
            List<Mark> in = e.getValue().stream().filter(m -> Snapshot.between(m.date(), c.from(), c.to()) && (c.teamId() == null || c.teamId().equals(m.teamId()))).toList();
            if (in.isEmpty()) continue;
            long present = in.stream().filter(m -> m.status() == AttendanceStatus.Present).count();
            long late = in.stream().filter(m -> m.status() == AttendanceStatus.Late).count();
            long absent = in.stream().filter(m -> m.status() == AttendanceStatus.Absent).count();
            long excused = in.stream().filter(m -> m.status() == AttendanceStatus.Excused).count();
            attendedAll += present + late;
            totalAll += in.size();
            Team t = teams.get(in.get(in.size() - 1).teamId());
            rows.add(row(Snapshot.name(a), t != null ? t.getTeamName() : "", in.size(), present, late, absent, excused, round1((present + late) * 100.0 / in.size())));
        }
        rows.sort(Comparator.comparing(r -> String.valueOf(r.get(0))));
        return report("attendance", "Attendance report", org, c, List.of(new Stat("Sessions held", String.valueOf(sessionsHeld.size())),
                        new Stat("Athletes recorded", String.valueOf(rows.size())), new Stat("Marks recorded", String.valueOf(totalAll)),
                        new Stat("Average attendance", totalAll == 0 ? "—" : Math.round(attendedAll * 100.0 / totalAll) + "%")),
                List.of("Athlete", "Team", "Sessions", "Present", "Late", "Absent", "Excused", "Attendance %"), rows);
    }

    // ---------------------------------------------------------------- performance
    private ReportData performance(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, Team> team = s.currentTeamByAthlete();
        Map<Integer, String> sport = s.sportNameByAthlete();
        Map<Integer, List<PerformanceRecord>> by = s.performance().stream()
                .filter(p -> Snapshot.between(p.getRecordDate(), c.from(), c.to()) && c.sees(p.getAthleteId()))
                .filter(p -> c.teamId() == null || (team.get(p.getAthleteId()) != null && team.get(p.getAthleteId()).getTeamId().equals(c.teamId())))
                .collect(Collectors.groupingBy(PerformanceRecord::getAthleteId));
        List<List<Object>> rows = new ArrayList<>();
        double sum = 0;
        int count = 0;
        for (Map.Entry<Integer, List<PerformanceRecord>> e : by.entrySet()) {
            Athlete a = athletes.get(e.getKey());
            if (a == null) continue;
            List<PerformanceRecord> list = e.getValue().stream().sorted(Comparator.comparing(PerformanceRecord::getRecordDate)).toList();
            DoubleSummaryStatistics st = list.stream().mapToDouble(p -> p.getRating().doubleValue()).summaryStatistics();
            sum += st.getSum();
            count += list.size();
            rows.add(row(Snapshot.name(a), team.containsKey(a.getAthleteId()) ? team.get(a.getAthleteId()).getTeamName() : "", sport.getOrDefault(a.getAthleteId(), ""),
                    list.size(), round1(st.getAverage()), list.get(list.size() - 1).getRating().doubleValue(), st.getMax()));
        }
        rows.sort(Comparator.comparingDouble((List<Object> r) -> ((Number) r.get(4)).doubleValue()).reversed());
        return report("performance", "Performance report", org, c, List.of(new Stat("Athletes rated", String.valueOf(rows.size())),
                        new Stat("Records", String.valueOf(count)), new Stat("Average rating", count == 0 ? "—" : String.format(Locale.ROOT, "%.1f", sum / count))),
                List.of("Athlete", "Team", "Sport", "Records", "Average rating", "Latest rating", "Best rating"), rows);
    }

    // ---------------------------------------------------------------- facilities
    private ReportData facilities(Ctx c, String org) {
        Snapshot s = c.s();
        long days = ChronoUnit.DAYS.between(c.from(), c.to()) + 1;
        List<List<Object>> rows = new ArrayList<>();
        long totalBooked = 0;
        for (Facility f : s.facilities()) {
            long booked = s.bookings().stream().filter(b -> b.getFacilityId().equals(f.getFacilityId()) && b.getStatus() == BookingStatus.Confirmed
                    && Snapshot.between(b.getBookingDate(), c.from(), c.to())).count();
            long cancelled = s.bookings().stream().filter(b -> b.getFacilityId().equals(f.getFacilityId()) && b.getStatus() == BookingStatus.Cancelled
                    && Snapshot.between(b.getBookingDate(), c.from(), c.to())).count();
            totalBooked += booked;
            double use = f.getStatus() == FacilityStatus.Available ? Math.min(100, booked * 100.0 / (days * 8)) : 0;
            rows.add(row(f.getFacilityName(), f.getFacilityType().name(), f.getStatus().name(), f.getCapacity(), booked, cancelled, round1(use)));
        }
        rows.sort(Comparator.comparingDouble((List<Object> r) -> ((Number) r.get(6)).doubleValue()).reversed());
        return report("facilities", "Facility report", org, c, List.of(new Stat("Facilities", String.valueOf(s.facilities().size())),
                        new Stat("Confirmed bookings", String.valueOf(totalBooked)),
                        new Stat("Not available", String.valueOf(s.facilities().stream().filter(f -> f.getStatus() != FacilityStatus.Available).count()))),
                List.of("Facility", "Type", "Status", "Capacity", "Bookings", "Cancelled", "Utilization %"), rows);
    }

    // ---------------------------------------------------------------- competitions
    private ReportData competitions(Ctx c, String org) {
        Snapshot s = c.s();
        Map<Integer, Team> teams = s.teamById();
        List<Competition> list = s.competitions().stream().filter(x -> Snapshot.between(x.getCompDate(), c.from(), c.to())).sorted(Comparator.comparing(Competition::getCompDate)).toList();
        List<List<Object>> rows = new ArrayList<>();
        for (Competition x : list) {
            long entered = s.teamCompetitions().stream().filter(tc -> tc.getId().getCompetitionId().equals(x.getCompetitionId())).count();
            List<Fixture> fixtures = s.fixtures().stream().filter(f -> f.getCompetitionId().equals(x.getCompetitionId())).toList();
            long played = fixtures.stream().filter(f -> f.getStatus() == FixtureStatus.Completed).count();
            String winner = s.teamCompetitions().stream().filter(tc -> tc.getId().getCompetitionId().equals(x.getCompetitionId()) && Integer.valueOf(1).equals(tc.getFinalPosition()))
                    .map(tc -> teams.get(tc.getId().getTeamId())).filter(Objects::nonNull).map(Team::getTeamName).findFirst().orElse("");
            rows.add(row(x.getCompName(), x.getCompDate().toString(), x.getVenue() == null ? "" : x.getVenue(), x.getLevel().name(), entered, fixtures.size(), played, winner));
        }
        return report("competitions", "Competition report", org, c, List.of(new Stat("Competitions", String.valueOf(list.size())),
                        new Stat("Fixtures played", String.valueOf(rows.stream().mapToLong(r -> ((Number) r.get(6)).longValue()).sum()))),
                List.of("Competition", "Date", "Venue", "Level", "Teams", "Fixtures", "Played", "Winner"), rows);
    }

    private static List<Object> row(Object... cells) { return new ArrayList<>(Arrays.asList(cells)); }
}
