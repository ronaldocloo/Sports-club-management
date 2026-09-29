package com.dev.sports_club.service;

import com.dev.sports_club.entity.*;
import com.dev.sports_club.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * One consistent, tenant-filtered read of the tables that analytics and reports draw on, with
 * the lookups they share. Loaded once per request; sized for club-scale data.
 */
@Component
@RequiredArgsConstructor
public class DataSnapshot {

    private final AthleteRepository athleteRepository;
    private final TeamRepository teamRepository;
    private final SportRepository sportRepository;
    private final TeamRosterRepository rosterRepository;
    private final MembershipRepository membershipRepository;
    private final MembershipTypeRepository typeRepository;
    private final PaymentRepository paymentRepository;
    private final FixtureRepository fixtureRepository;
    private final TrainingSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final PerformanceRecordRepository performanceRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityBookingRepository bookingRepository;
    private final CompetitionRepository competitionRepository;
    private final TeamCompetitionRepository teamCompetitionRepository;

    public Snapshot load() {
        return new Snapshot(
                athleteRepository.findAll(), teamRepository.findAll(), sportRepository.findAll(), rosterRepository.findAll(),
                membershipRepository.findAll(), typeRepository.findAll(), paymentRepository.findAll(), fixtureRepository.findAll(),
                sessionRepository.findAll(), attendanceRepository.findAll(), performanceRepository.findAll(), facilityRepository.findAll(),
                bookingRepository.findAll(), competitionRepository.findAll(), teamCompetitionRepository.findAll());
    }

    public record Snapshot(List<Athlete> athletes, List<Team> teams, List<Sport> sports, List<TeamRoster> rosters,
                           List<Membership> memberships, List<MembershipType> types, List<Payment> payments,
                           List<Fixture> fixtures, List<TrainingSession> sessions, List<Attendance> attendance,
                           List<PerformanceRecord> performance, List<Facility> facilities, List<FacilityBooking> bookings,
                           List<Competition> competitions, List<TeamCompetition> teamCompetitions) {

        public Map<Integer, Athlete> athleteById() { return athletes.stream().collect(Collectors.toMap(Athlete::getAthleteId, a -> a)); }
        public Map<Integer, Team> teamById() { return teams.stream().collect(Collectors.toMap(Team::getTeamId, t -> t)); }
        public Map<Integer, Sport> sportById() { return sports.stream().collect(Collectors.toMap(Sport::getSportId, s -> s)); }
        public Map<Integer, MembershipType> typeById() { return types.stream().collect(Collectors.toMap(MembershipType::getTypeId, t -> t)); }
        public Map<Integer, TrainingSession> sessionById() { return sessions.stream().collect(Collectors.toMap(TrainingSession::getSessionId, s -> s)); }

        public static String name(Athlete a) { return a.getFirstName() + " " + a.getLastName(); }

        /** Active roster entries only. */
        public List<TeamRoster> activeRosters() { return rosters.stream().filter(r -> Boolean.TRUE.equals(r.getIsActive())).toList(); }

        /** The team an athlete is currently on (most recently joined active roster), if any. */
        public Map<Integer, Team> currentTeamByAthlete() {
            Map<Integer, Team> teams = teamById();
            Map<Integer, Team> out = new HashMap<>();
            activeRosters().stream()
                    .sorted(Comparator.comparing(TeamRoster::getDateJoined))
                    .forEach(r -> { Team t = teams.get(r.getId().getTeamId()); if (t != null) out.put(r.getId().getAthleteId(), t); });
            return out;
        }

        public Map<Integer, String> sportNameByAthlete() {
            Map<Integer, Sport> sports = sportById();
            Map<Integer, String> out = new HashMap<>();
            currentTeamByAthlete().forEach((athleteId, team) -> {
                Sport s = sports.get(team.getSportId());
                if (s != null) out.put(athleteId, s.getSportName());
            });
            return out;
        }

        public Map<Integer, BigDecimal> paidByMembership() {
            Map<Integer, BigDecimal> out = new HashMap<>();
            payments.stream().filter(p -> p.getStatus() == PaymentStatus.Completed)
                    .forEach(p -> out.merge(p.getMembershipId(), p.getAmount(), BigDecimal::add));
            return out;
        }

        public boolean activeOn(Membership m, LocalDate day) {
            return m.getStatus() == MembershipStatus.Active && !m.getStartDate().isAfter(day) && !m.getEndDate().isBefore(day);
        }

        /** Each athlete's latest membership (active first, then latest end date). */
        public Map<Integer, Membership> latestMembershipByAthlete() {
            Map<Integer, Membership> out = new HashMap<>();
            memberships.stream()
                    .sorted(Comparator.comparing((Membership m) -> m.getStatus() == MembershipStatus.Active).thenComparing(Membership::getEndDate))
                    .forEach(m -> out.put(m.getAthleteId(), m));
            return out;
        }

        /** Attendance marks per athlete, oldest first, each with its session date. */
        public Map<Integer, List<Mark>> marksByAthlete() {
            Map<Integer, TrainingSession> byId = sessionById();
            Map<Integer, List<Mark>> out = new HashMap<>();
            for (Attendance a : attendance) {
                TrainingSession s = byId.get(a.getId().getSessionId());
                if (s == null) continue;
                out.computeIfAbsent(a.getId().getAthleteId(), k -> new ArrayList<>()).add(new Mark(s.getSessionDate(), s.getTeamId(), a.getStatus()));
            }
            out.values().forEach(l -> l.sort(Comparator.comparing(Mark::date)));
            return out;
        }

        public record Mark(LocalDate date, Integer teamId, AttendanceStatus status) {
            public boolean attended() { return status == AttendanceStatus.Present || status == AttendanceStatus.Late; }
        }

        public static boolean between(LocalDate d, LocalDate from, LocalDate to) { return !d.isBefore(from) && !d.isAfter(to); }
    }
}
