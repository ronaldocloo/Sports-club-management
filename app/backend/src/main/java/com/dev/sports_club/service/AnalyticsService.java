package com.dev.sports_club.service;

import com.dev.sports_club.dto.AnalyticsOverviewResponse;
import com.dev.sports_club.dto.AnalyticsOverviewResponse.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.service.DataSnapshot.Snapshot;
import com.dev.sports_club.service.DataSnapshot.Snapshot.Mark;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/** Organization-wide analytics for a date range, compared with the equally long period before it. */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final List<String> SLOTS = List.of("06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00");
    private static final List<String> DAYS = List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
    private static final int MAX_RANGE_DAYS = 800;

    private final DataSnapshot data;

    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse overview(LocalDate fromParam, LocalDate toParam) {
        LocalDate to = toParam != null ? toParam : LocalDate.now();
        LocalDate from = fromParam != null ? fromParam : to.minusDays(29);
        if (from.isAfter(to)) throw new BusinessRuleViolationException("The start date must be on or before the end date");
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days > MAX_RANGE_DAYS) throw new BusinessRuleViolationException("Choose a range of at most " + MAX_RANGE_DAYS + " days");
        LocalDate pTo = from.minusDays(1);
        LocalDate pFrom = pTo.minusDays(days - 1);

        Snapshot s = data.load();
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, Team> currentTeam = s.currentTeamByAthlete();
        Map<Integer, String> sportOf = s.sportNameByAthlete();

        Kpis kpis = new Kpis(
                metric(revenue(s, from, to), revenue(s, pFrom, pTo)),
                metric(newAthletes(s, from, to), newAthletes(s, pFrom, pTo)),
                metric(activeMemberships(s, to), activeMemberships(s, pTo)),
                metric(renewalRate(s, from, to), renewalRate(s, pFrom, pTo)),
                metric(attendanceRate(s, from, to), attendanceRate(s, pFrom, pTo)),
                metric(utilization(s, from, to), utilization(s, pFrom, pTo)),
                metric(fixturesPlayed(s, from, to), fixturesPlayed(s, pFrom, pTo)));

        Outstanding outstanding = outstanding(s, to);
        List<Attention> attention = attention(s, athletes, sportOf, to);
        Heatmap heatmap = heatmap(s, from, to);
        List<FacilityUse> facilities = facilities(s, from, to);

        return new AnalyticsOverviewResponse(
                new Period(from, to), new Period(pFrom, pTo), kpis,
                revenueByMonth(s, to), athleteGrowth(s, to), attendanceByMonth(s, to),
                membershipStatus(s, to), sports(sportOf), gender(s), ageBands(s, to), paymentMethods(s, from, to), plans(s, to),
                facilities, heatmap, teams(s, from, to, currentTeam),
                insights(kpis, outstanding, attention, heatmap, facilities, s, to), attention, outstanding);
    }

    // ---------------------------------------------------------------- KPIs

    private static Metric metric(double value, double previous) {
        Double change = previous == 0 ? null : Math.round(((value - previous) / previous) * 1000) / 10.0;
        return new Metric(round1(value), round1(previous), change);
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    private double revenue(Snapshot s, LocalDate from, LocalDate to) {
        return s.payments().stream()
                .filter(p -> p.getStatus() == PaymentStatus.Completed && Snapshot.between(p.getPaymentDate().toLocalDate(), from, to))
                .mapToDouble(p -> p.getAmount().doubleValue()).sum();
    }

    private double newAthletes(Snapshot s, LocalDate from, LocalDate to) {
        return s.athletes().stream().filter(a -> Snapshot.between(a.getJoinDate(), from, to)).count();
    }

    private double activeMemberships(Snapshot s, LocalDate day) {
        return s.memberships().stream().filter(m -> s.activeOn(m, day)).count();
    }

    /** Of the memberships that ended in the range, the share followed by a new one within 30 days either side. */
    private double renewalRate(Snapshot s, LocalDate from, LocalDate to) {
        List<Membership> ended = s.memberships().stream().filter(m -> Snapshot.between(m.getEndDate(), from, to)).toList();
        if (ended.isEmpty()) return 0;
        long renewed = ended.stream().filter(m -> s.memberships().stream().anyMatch(o ->
                !o.getMembershipId().equals(m.getMembershipId()) && o.getAthleteId().equals(m.getAthleteId())
                        && !o.getStartDate().isBefore(m.getEndDate().minusDays(30)) && !o.getStartDate().isAfter(m.getEndDate().plusDays(30)))).count();
        return renewed * 100.0 / ended.size();
    }

    private double attendanceRate(Snapshot s, LocalDate from, LocalDate to) {
        Map<Integer, TrainingSession> sessions = s.sessionById();
        long total = 0;
        long attended = 0;
        for (Attendance a : s.attendance()) {
            TrainingSession t = sessions.get(a.getId().getSessionId());
            if (t == null || !Snapshot.between(t.getSessionDate(), from, to)) continue;
            total++;
            if (a.getStatus() == AttendanceStatus.Present || a.getStatus() == AttendanceStatus.Late) attended++;
        }
        return total == 0 ? 0 : attended * 100.0 / total;
    }

    /** Confirmed bookings as a share of the slots the open facilities offered in the range. */
    private double utilization(Snapshot s, LocalDate from, LocalDate to) {
        long open = s.facilities().stream().filter(f -> f.getStatus() == FacilityStatus.Available).count();
        long capacity = open * (ChronoUnit.DAYS.between(from, to) + 1) * SLOTS.size();
        if (capacity == 0) return 0;
        Set<Integer> openIds = s.facilities().stream().filter(f -> f.getStatus() == FacilityStatus.Available).map(Facility::getFacilityId).collect(Collectors.toSet());
        long booked = s.bookings().stream().filter(b -> b.getStatus() == BookingStatus.Confirmed && openIds.contains(b.getFacilityId())
                && Snapshot.between(b.getBookingDate(), from, to)).count();
        return Math.min(100.0, booked * 100.0 / capacity);
    }

    private double fixturesPlayed(Snapshot s, LocalDate from, LocalDate to) {
        return s.fixtures().stream().filter(f -> f.getStatus() == FixtureStatus.Completed && Snapshot.between(f.getMatchDate(), from, to)).count();
    }

    // ---------------------------------------------------------------- series (last 12 months ending at `to`)

    private List<YearMonth> months(LocalDate to, int count) {
        YearMonth end = YearMonth.from(to);
        List<YearMonth> out = new ArrayList<>();
        for (int i = count - 1; i >= 0; i--) out.add(end.minusMonths(i));
        return out;
    }

    private List<MonthPoint> revenueByMonth(Snapshot s, LocalDate to) {
        Map<YearMonth, Double> sums = new HashMap<>();
        s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Completed)
                .forEach(p -> sums.merge(YearMonth.from(p.getPaymentDate()), p.getAmount().doubleValue(), Double::sum));
        return months(to, 12).stream().map(m -> new MonthPoint(m.toString(), round1(sums.getOrDefault(m, 0.0)))).toList();
    }

    private List<MonthPoint> athleteGrowth(Snapshot s, LocalDate to) {
        return months(to, 12).stream().map(m -> new MonthPoint(m.toString(),
                s.athletes().stream().filter(a -> !YearMonth.from(a.getJoinDate()).isAfter(m)).count())).toList();
    }

    private List<MonthPoint> attendanceByMonth(Snapshot s, LocalDate to) {
        Map<Integer, TrainingSession> sessions = s.sessionById();
        Map<YearMonth, long[]> tally = new HashMap<>();
        for (Attendance a : s.attendance()) {
            TrainingSession t = sessions.get(a.getId().getSessionId());
            if (t == null) continue;
            long[] c = tally.computeIfAbsent(YearMonth.from(t.getSessionDate()), k -> new long[2]);
            c[1]++;
            if (a.getStatus() == AttendanceStatus.Present || a.getStatus() == AttendanceStatus.Late) c[0]++;
        }
        return months(to, 6).stream().map(m -> {
            long[] c = tally.get(m);
            return new MonthPoint(m.toString(), c == null || c[1] == 0 ? 0 : round1(c[0] * 100.0 / c[1]));
        }).toList();
    }

    // ---------------------------------------------------------------- breakdowns

    private List<Slice> membershipStatus(Snapshot s, LocalDate day) {
        Map<String, Double> out = new LinkedHashMap<>();
        for (String k : List.of("Active", "Expiring soon", "Expired", "Suspended")) out.put(k, 0.0);
        for (Membership m : s.memberships()) {
            String key;
            if (m.getStatus() == MembershipStatus.Suspended) key = "Suspended";
            else if (m.getStatus() == MembershipStatus.Expired || m.getEndDate().isBefore(day)) key = "Expired";
            else if (!m.getEndDate().isAfter(day.plusDays(30))) key = "Expiring soon";
            else key = "Active";
            out.merge(key, 1.0, Double::sum);
        }
        return slices(out, false);
    }

    private List<Slice> sports(Map<Integer, String> sportOf) {
        Map<String, Double> out = new TreeMap<>();
        sportOf.values().forEach(n -> out.merge(n, 1.0, Double::sum));
        return slices(out, true);
    }

    private List<Slice> gender(Snapshot s) {
        Map<String, Double> out = new TreeMap<>();
        s.athletes().forEach(a -> out.merge(a.getGender().name(), 1.0, Double::sum));
        return slices(out, true);
    }

    private List<Slice> ageBands(Snapshot s, LocalDate day) {
        Map<String, Double> out = new LinkedHashMap<>();
        for (String k : List.of("Under 18", "18–21", "22–25", "26–30", "31+")) out.put(k, 0.0);
        for (Athlete a : s.athletes()) {
            int age = (int) ChronoUnit.YEARS.between(a.getDateOfBirth(), day);
            String k = age < 18 ? "Under 18" : age <= 21 ? "18–21" : age <= 25 ? "22–25" : age <= 30 ? "26–30" : "31+";
            out.merge(k, 1.0, Double::sum);
        }
        return slices(out, false);
    }

    private List<Slice> paymentMethods(Snapshot s, LocalDate from, LocalDate to) {
        Map<String, Double> out = new TreeMap<>();
        s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Completed && Snapshot.between(p.getPaymentDate().toLocalDate(), from, to))
                .forEach(p -> out.merge(methodLabel(p.getMethod()), p.getAmount().doubleValue(), Double::sum));
        return slices(out, true);
    }

    static String methodLabel(PaymentMethod m) {
        return switch (m) { case BankTransfer -> "Bank transfer"; case MobileMoney -> "Mobile money"; default -> m.name(); };
    }

    /** Memberships in force at the end of the range, by plan. */
    private List<Slice> plans(Snapshot s, LocalDate day) {
        Map<Integer, MembershipType> types = s.typeById();
        Map<String, Double> out = new TreeMap<>();
        s.memberships().stream().filter(m -> s.activeOn(m, day)).forEach(m -> {
            MembershipType t = types.get(m.getTypeId());
            out.merge(t != null ? t.getTypeName() : "Other", 1.0, Double::sum);
        });
        return slices(out, true);
    }

    private static List<Slice> slices(Map<String, Double> map, boolean dropZero) {
        return map.entrySet().stream().filter(e -> !dropZero || e.getValue() > 0).map(e -> new Slice(e.getKey(), round1(e.getValue()))).toList();
    }

    // ---------------------------------------------------------------- facilities, teams

    private List<FacilityUse> facilities(Snapshot s, LocalDate from, LocalDate to) {
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        return s.facilities().stream().map(f -> {
            long booked = s.bookings().stream().filter(b -> b.getFacilityId().equals(f.getFacilityId()) && b.getStatus() == BookingStatus.Confirmed
                    && Snapshot.between(b.getBookingDate(), from, to)).count();
            double use = f.getStatus() == FacilityStatus.Available ? Math.min(100.0, booked * 100.0 / (days * SLOTS.size())) : 0;
            return new FacilityUse(f.getFacilityId(), f.getFacilityName(), f.getFacilityType().name(), f.getStatus().name(), (int) booked, round1(use));
        }).sorted(Comparator.comparingDouble(FacilityUse::utilization).reversed()).toList();
    }

    private Heatmap heatmap(Snapshot s, LocalDate from, LocalDate to) {
        int[][] grid = new int[DAYS.size()][SLOTS.size()];
        for (FacilityBooking b : s.bookings()) {
            if (b.getStatus() != BookingStatus.Confirmed || !Snapshot.between(b.getBookingDate(), from, to)) continue;
            int slot = SLOTS.indexOf(b.getTimeSlot().name().substring(5, 7) + ":00");
            if (slot >= 0) grid[b.getBookingDate().getDayOfWeek().getValue() - 1][slot]++;
        }
        return new Heatmap(DAYS, SLOTS, grid);
    }

    private List<TeamRow> teams(Snapshot s, LocalDate from, LocalDate to, Map<Integer, Team> currentTeam) {
        Map<Integer, Sport> sports = s.sportById();
        Map<Integer, TrainingSession> sessions = s.sessionById();
        Map<Integer, List<Integer>> rosterByTeam = new HashMap<>();
        s.activeRosters().forEach(r -> rosterByTeam.computeIfAbsent(r.getId().getTeamId(), k -> new ArrayList<>()).add(r.getId().getAthleteId()));
        List<TeamRow> rows = new ArrayList<>();
        for (Team t : s.teams()) {
            int won = 0, drawn = 0, lost = 0, points = 0;
            for (Fixture f : s.fixtures()) {
                if (f.getStatus() != FixtureStatus.Completed || !Snapshot.between(f.getMatchDate(), from, to)) continue;
                boolean home = f.getHomeTeamId().equals(t.getTeamId());
                if (!home && !f.getAwayTeamId().equals(t.getTeamId())) continue;
                int mine = home ? f.getHomeScore() : f.getAwayScore();
                int theirs = home ? f.getAwayScore() : f.getHomeScore();
                if (mine > theirs) { won++; points += 3; } else if (mine == theirs) { drawn++; points++; } else lost++;
            }
            long total = 0, attended = 0;
            for (Attendance a : s.attendance()) {
                TrainingSession ts = sessions.get(a.getId().getSessionId());
                if (ts == null || !ts.getTeamId().equals(t.getTeamId()) || !Snapshot.between(ts.getSessionDate(), from, to)) continue;
                total++;
                if (a.getStatus() == AttendanceStatus.Present || a.getStatus() == AttendanceStatus.Late) attended++;
            }
            List<Integer> squad = rosterByTeam.getOrDefault(t.getTeamId(), List.of());
            OptionalDouble rating = s.performance().stream().filter(p -> squad.contains(p.getAthleteId()) && Snapshot.between(p.getRecordDate(), from, to))
                    .mapToDouble(p -> p.getRating().doubleValue()).average();
            Sport sport = sports.get(t.getSportId());
            rows.add(new TeamRow(t.getTeamId(), t.getTeamName(), sport != null ? sport.getSportName() : null, squad.size(), won + drawn + lost, won, drawn, lost, points,
                    total == 0 ? null : round1(attended * 100.0 / total), rating.isPresent() ? round1(rating.getAsDouble()) : null));
        }
        rows.sort(Comparator.comparingInt(TeamRow::points).reversed().thenComparing(TeamRow::name));
        return rows;
    }

    // ---------------------------------------------------------------- outstanding balances, attention, insights

    private Outstanding outstanding(Snapshot s, LocalDate day) {
        Map<Integer, BigDecimal> paid = s.paidByMembership();
        double amount = 0;
        int count = 0;
        for (Membership m : s.memberships()) {
            if (m.getStatus() != MembershipStatus.Active) continue;
            BigDecimal balance = m.getAmountCharged().subtract(paid.getOrDefault(m.getMembershipId(), BigDecimal.ZERO));
            if (balance.signum() > 0) { amount += balance.doubleValue(); count++; }
        }
        return new Outstanding(round1(amount), count);
    }

    /** Athletes worth a conversation. These are suggestions for people to review, not automatic decisions. */
    private List<Attention> attention(Snapshot s, Map<Integer, Athlete> athletes, Map<Integer, String> sportOf, LocalDate day) {
        Map<Integer, List<String>> reasons = new LinkedHashMap<>();
        Map<Integer, List<Mark>> marks = s.marksByAthlete();
        marks.forEach((athleteId, list) -> {
            List<Mark> last = list.size() > 24 ? list.subList(list.size() - 24, list.size()) : list;
            if (last.size() < 6) return;
            int half = last.size() / 2;
            double earlier = rate(last.subList(0, half));
            double recent = rate(last.subList(last.size() - half, last.size()));
            if (earlier - recent >= 15) reasons.computeIfAbsent(athleteId, k -> new ArrayList<>()).add("Attendance down " + Math.round(earlier - recent) + " points recently");
        });
        Map<Integer, BigDecimal> paid = s.paidByMembership();
        for (Membership m : s.memberships()) {
            if (m.getStatus() != MembershipStatus.Active) continue;
            List<String> r = reasons.computeIfAbsent(m.getAthleteId(), k -> new ArrayList<>());
            long left = ChronoUnit.DAYS.between(day, m.getEndDate());
            if (left < 0) r.add("Membership expired " + (-left) + " days ago");
            else if (left <= 14) r.add("Membership expires in " + left + (left == 1 ? " day" : " days"));
            BigDecimal balance = m.getAmountCharged().subtract(paid.getOrDefault(m.getMembershipId(), BigDecimal.ZERO));
            if (balance.signum() > 0 && m.getStartDate().isBefore(day.minusDays(30))) r.add("Unpaid balance of GH₵" + balance.stripTrailingZeros().toPlainString());
        }
        return reasons.entrySet().stream().filter(e -> !e.getValue().isEmpty() && athletes.containsKey(e.getKey()))
                .map(e -> new Attention(e.getKey(), Snapshot.name(athletes.get(e.getKey())), sportOf.get(e.getKey()), e.getValue()))
                .sorted(Comparator.comparingInt((Attention a) -> a.reasons().size()).reversed().thenComparing(Attention::name))
                .limit(50).toList();
    }

    private static double rate(List<Mark> list) {
        return list.isEmpty() ? 0 : list.stream().filter(Mark::attended).count() * 100.0 / list.size();
    }

    private List<Insight> insights(Kpis k, Outstanding outstanding, List<Attention> attention, Heatmap heatmap, List<FacilityUse> facilities, Snapshot s, LocalDate day) {
        List<Insight> out = new ArrayList<>();
        Metric rev = k.revenue();
        if (rev.changePct() != null) {
            boolean up = rev.changePct() >= 0;
            out.add(new Insight(up ? "success" : "warning", "Revenue", "Revenue " + (up ? "increased " : "decreased ") + Math.abs(rev.changePct()) + "% compared with the previous period (GH₵" + Math.round(rev.value()) + " vs GH₵" + Math.round(rev.previous()) + ").", "/payments"));
        } else if (rev.value() > 0) {
            out.add(new Insight("info", "Revenue", "GH₵" + Math.round(rev.value()) + " collected in this period. There is no earlier period to compare with yet.", "/payments"));
        }
        long expiring = s.memberships().stream().filter(m -> m.getStatus() == MembershipStatus.Active && !m.getEndDate().isBefore(day) && !m.getEndDate().isAfter(day.plusDays(14))).count();
        if (expiring > 0) out.add(new Insight("warning", "Memberships", expiring + (expiring == 1 ? " membership expires" : " memberships expire") + " within 14 days. A renewal reminder now avoids lapses.", "/memberships"));
        if (outstanding.amount() > 0) out.add(new Insight("warning", "Payments", "GH₵" + Math.round(outstanding.amount()) + " is still owed on " + outstanding.memberships() + " active memberships.", "/payments"));
        long decliners = attention.stream().filter(a -> a.reasons().stream().anyMatch(r -> r.startsWith("Attendance"))).count();
        if (decliners > 0) out.add(new Insight("danger", "Retention", decliners + (decliners == 1 ? " athlete shows" : " athletes show") + " declining attendance. Review them in the attention list.", "/attendance"));
        if (k.renewalRate().value() > 0 || k.renewalRate().previous() > 0) {
            out.add(new Insight(k.renewalRate().value() >= 60 ? "success" : "warning", "Renewals", "Renewal rate is " + Math.round(k.renewalRate().value()) + "% for memberships that ended in this period.", "/memberships"));
        }
        int best = -1, bestDay = 0, bestSlot = 0;
        for (int d = 0; d < heatmap.grid().length; d++) for (int sl = 0; sl < heatmap.grid()[d].length; sl++) if (heatmap.grid()[d][sl] > best) { best = heatmap.grid()[d][sl]; bestDay = d; bestSlot = sl; }
        if (best > 0) out.add(new Insight("info", "Facility demand", DayOfWeek.of(bestDay + 1).name().charAt(0) + DayOfWeek.of(bestDay + 1).name().substring(1).toLowerCase() + " " + heatmap.slots().get(bestSlot) + " is the busiest slot (" + best + " bookings).", "/bookings"));
        facilities.stream().filter(f -> "Available".equals(f.status()) && f.utilization() < 10).findFirst()
                .filter(f -> facilities.stream().anyMatch(o -> o.utilization() >= 50))
                .ifPresent(f -> out.add(new Insight("info", "Facilities", f.name() + " is barely used (" + f.utilization() + "%) while others are busy. Consider promoting it.", "/facilities")));
        Set<Integer> withMembership = s.memberships().stream().filter(m -> s.activeOn(m, day)).map(Membership::getAthleteId).collect(Collectors.toSet());
        long unmembered = s.activeRosters().stream().map(r -> r.getId().getAthleteId()).distinct().filter(a -> !withMembership.contains(a)).count();
        if (unmembered > 0) out.add(new Insight("warning", "Memberships", unmembered + (unmembered == 1 ? " athlete plays" : " athletes play") + " for a team without a current membership.", "/athletes"));
        Set<Integer> comps = s.fixtures().stream().map(Fixture::getCompetitionId).collect(Collectors.toSet());
        s.competitions().stream().filter(c -> !c.getCompDate().isBefore(day) && !c.getCompDate().isAfter(day.plusDays(14)) && !comps.contains(c.getCompetitionId()))
                .forEach(c -> out.add(new Insight("warning", "Competitions", c.getCompName() + " is on " + c.getCompDate() + " but has no fixtures scheduled.", "/competitions/" + c.getCompetitionId())));
        return out;
    }
}
