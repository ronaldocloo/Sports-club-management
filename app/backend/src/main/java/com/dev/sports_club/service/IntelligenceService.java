package com.dev.sports_club.service;

import com.dev.sports_club.dto.IntelligenceResponses.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.intelligence.RetentionScorer;
import com.dev.sports_club.intelligence.Trend;
import com.dev.sports_club.repository.AppUserRepository;
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
import java.time.temporal.IsoFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Explainable, statistical "intelligence": retention risk, revenue and attendance forecasts, facility
 * demand and payment anomalies. Everything is derived from the organization's own data with simple,
 * documented rules, and every result carries the reasons behind it. These are prompts for a person to
 * review, not automatic decisions.
 */
@Service
@RequiredArgsConstructor
public class IntelligenceService {

    private static final List<String> SLOTS = List.of("06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00");
    private static final List<String> DAYS = List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday");

    private final DataSnapshot data;
    private final AccessScope scope;
    private final NotificationService notifications;
    private final AppUserRepository userRepository;

    // ================================================================ retention risk

    @Transactional(readOnly = true)
    public RetentionOverview retention(LocalDate today) {
        Snapshot s = data.load();
        Map<Integer, Athlete> athletes = s.athleteById();
        Map<Integer, String> sportOf = s.sportNameByAthlete();
        Map<Integer, List<Membership>> byAthlete = s.memberships().stream().collect(Collectors.groupingBy(Membership::getAthleteId));
        Map<Integer, BigDecimal> paid = s.paidByMembership();
        Map<Integer, List<Mark>> marks = s.marksByAthlete();
        Map<Integer, Team> team = s.currentTeamByAthlete();
        Set<Integer> onRoster = s.activeRosters().stream().map(r -> r.getId().getAthleteId()).collect(Collectors.toSet());

        // Teams that held a session in the last 30 days, and who attended.
        Map<Integer, TrainingSession> sessions = s.sessionById();
        Set<Integer> teamsTrainingRecently = s.sessions().stream().filter(t -> Snapshot.between(t.getSessionDate(), today.minusDays(30), today)).map(TrainingSession::getTeamId).collect(Collectors.toSet());
        Set<Integer> attendedRecently = new HashSet<>();
        for (Attendance a : s.attendance()) {
            TrainingSession t = sessions.get(a.getId().getSessionId());
            if (t != null && Snapshot.between(t.getSessionDate(), today.minusDays(30), today)
                    && (a.getStatus() == AttendanceStatus.Present || a.getStatus() == AttendanceStatus.Late)) attendedRecently.add(a.getId().getAthleteId());
        }
        Set<Integer> withAccount = userRepository.findAll().stream().map(AppUser::getAthleteId).filter(Objects::nonNull).collect(Collectors.toSet());

        List<RetentionRisk> out = new ArrayList<>();
        int high = 0, medium = 0, low = 0;
        for (Athlete a : athletes.values()) {
            List<Membership> ms = byAthlete.getOrDefault(a.getAthleteId(), List.of());
            if (ms.isEmpty() && !onRoster.contains(a.getAthleteId())) continue;
            Membership latest = ms.stream().max(Comparator.comparing((Membership m) -> m.getStatus() == MembershipStatus.Active).thenComparing(Membership::getEndDate)).orElse(null);
            Long days = latest == null ? null : ChronoUnit.DAYS.between(today, latest.getEndDate());
            boolean active = latest != null && latest.getStatus() == MembershipStatus.Active && !latest.getEndDate().isBefore(today);

            List<Mark> list = marks.getOrDefault(a.getAthleteId(), List.of());
            List<Mark> last = list.size() > 24 ? list.subList(list.size() - 24, list.size()) : list;
            Double recent = null, earlier = null;
            if (last.size() >= 4) {
                int half = last.size() / 2;
                earlier = rate(last.subList(0, half));
                recent = rate(last.subList(last.size() - half, last.size()));
            } else if (!last.isEmpty()) {
                recent = rate(last);
            }
            Team t = team.get(a.getAthleteId());
            boolean silent = t != null && teamsTrainingRecently.contains(t.getTeamId()) && !attendedRecently.contains(a.getAthleteId());

            double balance = 0;
            if (latest != null && latest.getStatus() == MembershipStatus.Active) {
                balance = Math.max(0, latest.getAmountCharged().subtract(paid.getOrDefault(latest.getMembershipId(), BigDecimal.ZERO)).doubleValue());
            }
            long age = ms.stream().map(Membership::getStartDate).min(Comparator.naturalOrder()).map(d -> ChronoUnit.DAYS.between(d, today)).orElse(0L);
            RetentionScorer.Result r = RetentionScorer.score(new RetentionScorer.Input(days, active, recent, earlier, silent, balance, age, ms.size() >= 2));

            switch (r.band()) { case "High" -> high++; case "Medium" -> medium++; default -> low++; }
            if (r.score() >= 20) {
                out.add(new RetentionRisk(a.getAthleteId(), Snapshot.name(a), sportOf.get(a.getAthleteId()), r.score(), r.band(), r.action(),
                        r.factors().stream().map(f -> new Factor(f.label(), f.points())).toList(), withAccount.contains(a.getAthleteId())));
            }
        }
        out.sort(Comparator.comparingInt(RetentionRisk::score).reversed().thenComparing(RetentionRisk::name));
        return new RetentionOverview(out.stream().limit(100).toList(), high, medium, low,
                "Each athlete gets 0–100 points from membership status, attendance level and trend, unpaid balance and loyalty. "
                        + "High is 60+, Medium 35+. Every factor is listed so you can check the reasoning.");
    }

    private static double rate(List<Mark> list) {
        return list.isEmpty() ? 0 : Math.round(list.stream().filter(Mark::attended).count() * 1000.0 / list.size()) / 10.0;
    }

    /** Sends the athlete (if they have an account) a friendly nudge. A person decides to do this; it is never automatic. */
    @Transactional
    public int nudge(Integer athleteId) {
        Snapshot s = data.load();
        Athlete a = s.athleteById().get(athleteId);
        if (a == null) throw new jakarta.persistence.EntityNotFoundException("Athlete not found: " + athleteId);
        Membership latest = s.memberships().stream().filter(m -> m.getAthleteId().equals(athleteId)).max(Comparator.comparing(Membership::getEndDate)).orElse(null);
        String text = latest == null
                ? "You don't have a membership yet. Speak to the front desk to get started."
                : latest.getEndDate().isBefore(LocalDate.now())
                ? "Your membership has ended. Renew it to keep training with your team."
                : "Your membership ends on " + latest.getEndDate() + ". Renew soon so you don't miss any sessions.";
        List<AppUser> accounts = userRepository.findByAthleteIdAndIsActiveTrue(athleteId);
        if (accounts.isEmpty()) {
            throw new BusinessRuleViolationException(Snapshot.name(a) + " has no user account to notify. Contact them directly.");
        }
        notifications.notifyUsers(accounts, NotificationKind.membership, text, "/me", "nudge:" + athleteId + ":" + LocalDate.now());
        return accounts.size();
    }

    // ================================================================ revenue forecast

    @Transactional(readOnly = true)
    public RevenueForecast revenueForecast(LocalDate today) {
        Snapshot s = data.load();
        Map<YearMonth, Double> sums = new TreeMap<>();
        s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Completed)
                .forEach(p -> sums.merge(YearMonth.from(p.getPaymentDate()), p.getAmount().doubleValue(), Double::sum));
        YearMonth lastFull = YearMonth.from(today).minusMonths(1);
        List<MonthValue> history = new ArrayList<>();
        if (!sums.isEmpty()) {
            YearMonth first = sums.keySet().iterator().next();
            YearMonth start = lastFull.minusMonths(11).isAfter(first) ? lastFull.minusMonths(11) : first;
            for (YearMonth m = start; !m.isAfter(lastFull); m = m.plusMonths(1)) history.add(new MonthValue(m.toString(), round1(sums.getOrDefault(m, 0.0))));
        }

        Pipeline pipeline = pipeline(s, today);
        if (history.size() < 4) {
            return new RevenueForecast(history, List.of(), null, "Linear trend", pipeline,
                    "At least 4 months of payment history are needed to forecast. " + history.size() + " available.");
        }
        double[] y = history.stream().mapToDouble(MonthValue::value).toArray();
        Trend.Fit fit = Trend.linear(y);
        List<ForecastPoint> forecast = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            double expected = Math.max(0, fit.predict(y.length - 1 + i));
            double band = 1.28 * fit.residualStd(); // roughly an 80% range
            forecast.add(new ForecastPoint(lastFull.plusMonths(i).toString(), round1(expected), round1(Math.max(0, expected - band)), round1(expected + band)));
        }
        return new RevenueForecast(history, forecast, round1(fit.slope()),
                "Straight-line trend over the last " + y.length + " months; the shaded range is the typical month-to-month variation (about 80%).",
                pipeline, null);
    }

    private Pipeline pipeline(Snapshot s, LocalDate today) {
        Map<Integer, MembershipType> types = s.typeById();
        List<Membership> ending = s.memberships().stream()
                .filter(m -> m.getStatus() == MembershipStatus.Active && !m.getEndDate().isBefore(today) && !m.getEndDate().isAfter(today.plusDays(60))).toList();
        double amount = ending.stream().mapToDouble(m -> { MembershipType t = types.get(m.getTypeId()); return t != null ? t.getFee().doubleValue() : m.getAmountCharged().doubleValue(); }).sum();

        // Historical renewal rate over the last year, defaulting to 60% when there is no history.
        List<Membership> ended = s.memberships().stream().filter(m -> Snapshot.between(m.getEndDate(), today.minusDays(365), today)).toList();
        double p = ended.isEmpty() ? 0.6 : ended.stream().filter(m -> s.memberships().stream().anyMatch(o ->
                !o.getMembershipId().equals(m.getMembershipId()) && o.getAthleteId().equals(m.getAthleteId())
                        && !o.getStartDate().isBefore(m.getEndDate().minusDays(30)) && !o.getStartDate().isAfter(m.getEndDate().plusDays(30)))).count() / (double) ended.size();
        p = Math.max(0.05, Math.min(0.95, p));
        return new Pipeline(ending.size(), round1(amount), Math.round(p * 100) / 100.0, round1(amount * p), round1(amount * (1 - p)));
    }

    // ================================================================ attendance outlook

    @Transactional(readOnly = true)
    public List<TeamOutlook> attendanceOutlook(LocalDate today) {
        Snapshot s = data.load();
        Map<Integer, TrainingSession> sessions = s.sessionById();
        LocalDate from = today.minusWeeks(8);
        List<TeamOutlook> out = new ArrayList<>();
        for (Team t : s.teams()) {
            Map<String, long[]> weeks = new TreeMap<>();
            for (Attendance a : s.attendance()) {
                TrainingSession ts = sessions.get(a.getId().getSessionId());
                if (ts == null || !ts.getTeamId().equals(t.getTeamId()) || ts.getSessionDate().isBefore(from) || ts.getSessionDate().isAfter(today)) continue;
                String key = ts.getSessionDate().get(IsoFields.WEEK_BASED_YEAR) + "-" + String.format("%02d", ts.getSessionDate().get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                long[] c = weeks.computeIfAbsent(key, k -> new long[2]);
                c[1]++;
                if (a.getStatus() == AttendanceStatus.Present || a.getStatus() == AttendanceStatus.Late) c[0]++;
            }
            double[] rates = weeks.values().stream().mapToDouble(c -> c[0] * 100.0 / c[1]).toArray();
            if (rates.length < 3) {
                if (rates.length > 0) out.add(new TeamOutlook(t.getTeamId(), t.getTeamName(), round1(Trend.mean(rates)), null, null, "Not enough data"));
                continue;
            }
            int n = rates.length;
            int k = Math.min(3, n / 2);
            double current = Trend.mean(Arrays.copyOfRange(rates, n - k, n));
            double previous = Trend.mean(Arrays.copyOfRange(rates, Math.max(0, n - 2 * k), n - k));
            Trend.Fit fit = Trend.linear(rates);
            double projected = Math.max(0, Math.min(100, fit.predict(n - 1 + 4)));
            String status = projected < 60 ? "At risk" : projected < current - 5 ? "Declining" : projected > current + 5 ? "Improving" : "Steady";
            out.add(new TeamOutlook(t.getTeamId(), t.getTeamName(), round1(current), round1(previous), round1(projected), status));
        }
        out.sort(Comparator.comparing((TeamOutlook o) -> o.projectedRate() == null ? 101 : o.projectedRate()));
        return out;
    }

    // ================================================================ facility demand

    @Transactional(readOnly = true)
    public FacilityDemand facilityDemand(LocalDate today) {
        Snapshot s = data.load();
        int open = (int) s.facilities().stream().filter(f -> f.getStatus() == FacilityStatus.Available).count();
        LocalDate from = today.minusWeeks(8);
        List<FacilityBooking> recent = s.bookings().stream().filter(b -> b.getStatus() == BookingStatus.Confirmed && Snapshot.between(b.getBookingDate(), from, today)).toList();
        int weeks = recent.isEmpty() ? 0 : (int) Math.max(1, Math.min(8, ChronoUnit.WEEKS.between(recent.stream().map(FacilityBooking::getBookingDate).min(Comparator.naturalOrder()).get(), today) + 1));
        double[][] predicted = new double[DAYS.size()][SLOTS.size()];
        for (FacilityBooking b : recent) {
            int slot = SLOTS.indexOf(b.getTimeSlot().name().substring(5, 7) + ":00");
            if (slot >= 0) predicted[b.getBookingDate().getDayOfWeek().getValue() - 1][slot]++;
        }
        List<SlotDemand> all = new ArrayList<>();
        for (int d = 0; d < DAYS.size(); d++) for (int sl = 0; sl < SLOTS.size(); sl++) {
            predicted[d][sl] = weeks == 0 ? 0 : Math.round(predicted[d][sl] / weeks * 100) / 100.0;
            all.add(new SlotDemand(DAYS.get(d), SLOTS.get(sl), predicted[d][sl], open == 0 ? 0 : Math.round(predicted[d][sl] / open * 100) / 100.0));
        }
        List<SlotDemand> peaks = all.stream().filter(x -> x.predictedBookings() > 0).sorted(Comparator.comparingDouble(SlotDemand::predictedBookings).reversed()).limit(5).toList();
        // Quiet slots: weekday daytime/evening slots nobody books, good candidates for maintenance.
        List<SlotDemand> quiet = all.stream().filter(x -> DAYS.indexOf(x.day()) < 5 && !x.slot().equals("06:00") && !x.slot().equals("20:00"))
                .sorted(Comparator.comparingDouble(SlotDemand::predictedBookings)).limit(5).toList();

        List<String> tips = new ArrayList<>();
        if (weeks == 0) tips.add("No confirmed bookings in the last 8 weeks, so there is nothing to predict yet.");
        else {
            if (!peaks.isEmpty()) tips.add(peaks.get(0).day() + " " + peaks.get(0).slot() + " is expected to be the busiest slot (about " + peaks.get(0).predictedBookings() + " bookings a week). Book early or add capacity.");
            if (!quiet.isEmpty() && quiet.get(0).predictedBookings() == 0) tips.add("Schedule maintenance on " + quiet.get(0).day() + " " + quiet.get(0).slot() + ": it is rarely booked.");
            if (open < s.facilities().size()) tips.add((s.facilities().size() - open) + " facilities are not available, which concentrates demand on the rest.");
        }
        return new FacilityDemand(DAYS, SLOTS, predicted, peaks, quiet, tips, weeks, open);
    }

    // ================================================================ payment anomalies

    @Transactional(readOnly = true)
    public List<Anomaly> anomalies(LocalDate today) {
        Snapshot s = data.load();
        Map<Integer, Membership> memberships = s.memberships().stream().collect(Collectors.toMap(Membership::getMembershipId, m -> m));
        Map<Integer, Athlete> athletes = s.athleteById();
        List<Anomaly> out = new ArrayList<>();
        java.util.function.Function<Payment, String> who = p -> {
            Membership m = memberships.get(p.getMembershipId());
            Athlete a = m == null ? null : athletes.get(m.getAthleteId());
            return a == null ? "a member" : Snapshot.name(a);
        };

        // Possible duplicates: same membership and amount, both completed, within 24 hours.
        List<Payment> done = s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Completed).sorted(Comparator.comparing(Payment::getPaymentDate)).toList();
        for (int i = 0; i < done.size(); i++) for (int j = i + 1; j < done.size(); j++) {
            Payment a = done.get(i), b = done.get(j);
            if (a.getMembershipId().equals(b.getMembershipId()) && a.getAmount().compareTo(b.getAmount()) == 0
                    && ChronoUnit.HOURS.between(a.getPaymentDate(), b.getPaymentDate()) < 24) {
                out.add(new Anomaly("warning", "Possible duplicate", "Two identical payments from " + who.apply(a),
                        "GH₵" + a.getAmount().stripTrailingZeros().toPlainString() + " was recorded twice within 24 hours (#" + a.getPaymentId() + " and #" + b.getPaymentId() + ").", "/payments"));
            }
        }

        // Repeated failures for one member in the last 30 days.
        Map<Integer, Long> failed = s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Failed && Snapshot.between(p.getPaymentDate().toLocalDate(), today.minusDays(30), today))
                .collect(Collectors.groupingBy(Payment::getMembershipId, Collectors.counting()));
        s.payments().stream().filter(p -> failed.getOrDefault(p.getMembershipId(), 0L) >= 2).map(Payment::getMembershipId).distinct().forEach(id -> {
            Payment sample = s.payments().stream().filter(p -> p.getMembershipId().equals(id)).findFirst().get();
            out.add(new Anomaly("warning", "Repeated failures", who.apply(sample) + " has " + failed.get(id) + " failed payments in 30 days", "Their payment method may need attention.", "/payments"));
        });

        // Refund rate.
        long completed30 = s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Completed && Snapshot.between(p.getPaymentDate().toLocalDate(), today.minusDays(30), today)).count();
        long refunded30 = s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Refunded && Snapshot.between(p.getPaymentDate().toLocalDate(), today.minusDays(30), today)).count();
        if (completed30 + refunded30 >= 5 && refunded30 * 100.0 / (completed30 + refunded30) > 15) {
            out.add(new Anomaly("danger", "High refund rate", Math.round(refunded30 * 100.0 / (completed30 + refunded30)) + "% of payments were refunded in 30 days",
                    refunded30 + " of " + (completed30 + refunded30) + " payments. Worth checking why.", "/payments"));
        }

        // Pending payments that have sat for over two weeks.
        s.payments().stream().filter(p -> p.getStatus() == PaymentStatus.Pending && p.getPaymentDate().toLocalDate().isBefore(today.minusDays(14)))
                .forEach(p -> out.add(new Anomaly("info", "Stale pending payment", "Payment #" + p.getPaymentId() + " from " + who.apply(p) + " is still pending",
                        "Pending since " + p.getPaymentDate().toLocalDate() + " (GH₵" + p.getAmount().stripTrailingZeros().toPlainString() + ").", "/payments")));

        // Unusually large payment compared with the rest (needs enough history to judge).
        double[] amounts = done.stream().mapToDouble(p -> p.getAmount().doubleValue()).toArray();
        if (amounts.length >= 8) {
            double mean = Trend.mean(amounts), sd = Trend.stdDev(amounts);
            if (sd > 0) done.stream().filter(p -> (p.getAmount().doubleValue() - mean) / sd > 3)
                    .forEach(p -> out.add(new Anomaly("info", "Unusually large payment", "GH₵" + p.getAmount().stripTrailingZeros().toPlainString() + " from " + who.apply(p),
                            "This is more than 3 standard deviations above the average payment (GH₵" + Math.round(mean) + ").", "/payments")));
        }

        // Bookings cancelled far more than usual.
        List<FacilityBooking> recent = s.bookings().stream().filter(b -> Snapshot.between(b.getBookingDate(), today.minusDays(30), today)).toList();
        long cancelled = recent.stream().filter(b -> b.getStatus() == BookingStatus.Cancelled).count();
        if (recent.size() >= 8 && cancelled * 100.0 / recent.size() > 30) {
            out.add(new Anomaly("warning", "Many cancelled bookings", Math.round(cancelled * 100.0 / recent.size()) + "% of bookings were cancelled in 30 days",
                    cancelled + " of " + recent.size() + " bookings.", "/bookings"));
        }

        out.sort(Comparator.comparingInt((Anomaly a) -> switch (a.severity()) { case "danger" -> 0; case "warning" -> 1; default -> 2; }));
        return out;
    }

    // ================================================================ athlete insight

    @Transactional(readOnly = true)
    public AthleteInsight athleteInsight(Integer athleteId, LocalDate today) {
        scope.current().requireAthlete(athleteId);
        Snapshot s = data.load();
        Athlete a = s.athleteById().get(athleteId);
        if (a == null) throw new jakarta.persistence.EntityNotFoundException("Athlete not found: " + athleteId);
        String first = a.getFirstName();
        List<PerformanceRecord> recs = s.performance().stream().filter(p -> p.getAthleteId().equals(athleteId)).sorted(Comparator.comparing(PerformanceRecord::getRecordDate)).toList();
        List<PerformanceRecord> last = recs.size() > 8 ? recs.subList(recs.size() - 8, recs.size()) : recs;
        List<String> highlights = new ArrayList<>();

        String trend = "Not enough data";
        Double change = null, latest = null, consistency = null;
        if (!last.isEmpty()) latest = last.get(last.size() - 1).getRating().doubleValue();
        if (last.size() >= 3) {
            double[] y = last.stream().mapToDouble(p -> p.getRating().doubleValue()).toArray();
            Trend.Fit fit = Trend.linear(y);
            trend = fit.slope() > 0.8 ? "Improving" : fit.slope() < -0.8 ? "Declining" : "Steady";
            change = y[0] == 0 ? null : Math.round((y[y.length - 1] - y[0]) / y[0] * 1000) / 10.0;
            consistency = Math.round(Trend.stdDev(y) * 10) / 10.0;
            highlights.add(first + "'s rating has been " + trend.toLowerCase() + " over the last " + y.length + " records" + (change != null ? " (" + (change >= 0 ? "+" : "") + change + "% from the first to the latest)." : "."));
            if (consistency <= 4) highlights.add("Ratings are very consistent (typical swing of " + consistency + " points).");
            else if (consistency >= 12) highlights.add("Ratings vary a lot from session to session (typical swing of " + consistency + " points).");
        }

        Double teamAvg = null;
        Team team = s.currentTeamByAthlete().get(athleteId);
        if (team != null) {
            Set<Integer> squad = s.activeRosters().stream().filter(r -> r.getId().getTeamId().equals(team.getTeamId())).map(r -> r.getId().getAthleteId()).collect(Collectors.toSet());
            OptionalDouble avg = s.performance().stream().filter(p -> squad.contains(p.getAthleteId()) && Snapshot.between(p.getRecordDate(), today.minusDays(60), today)).mapToDouble(p -> p.getRating().doubleValue()).average();
            if (avg.isPresent()) teamAvg = Math.round(avg.getAsDouble() * 10) / 10.0;
            if (teamAvg != null && latest != null) {
                double diff = Math.round((latest - teamAvg) * 10) / 10.0;
                if (Math.abs(diff) >= 3) highlights.add("Latest rating is " + Math.abs(diff) + " points " + (diff > 0 ? "above" : "below") + " the " + team.getTeamName() + " average (" + teamAvg + ").");
            }
        }

        List<Mark> marks = s.marksByAthlete().getOrDefault(athleteId, List.of());
        List<Mark> lastMarks = marks.size() > 24 ? marks.subList(marks.size() - 24, marks.size()) : marks;
        String attTrend = "Not enough data";
        if (lastMarks.size() >= 4) {
            int half = lastMarks.size() / 2;
            double earlier = rate(lastMarks.subList(0, half)), recent = rate(lastMarks.subList(lastMarks.size() - half, lastMarks.size()));
            attTrend = recent - earlier >= 5 ? "Improving" : earlier - recent >= 5 ? "Declining" : "Steady";
            if (!attTrend.equals("Steady")) highlights.add("Training attendance is " + attTrend.toLowerCase() + " (" + Math.round(earlier) + "% earlier, " + Math.round(recent) + "% recently).");
        }
        if (highlights.isEmpty()) highlights.add("There is not enough recorded performance or attendance yet to draw conclusions.");
        return new AthleteInsight(athleteId, trend, change, latest, teamAvg, consistency, attTrend, highlights);
    }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
