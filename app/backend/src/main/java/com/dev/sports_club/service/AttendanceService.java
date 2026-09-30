package com.dev.sports_club.service;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.*;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/** Training sessions and who attended them. Coaches manage their own teams; Admins manage all. */
@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceService {

    private final TrainingSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final TeamRepository teamRepository;
    private final TeamRosterRepository rosterRepository;
    private final AccessScope scope;

    @Transactional(readOnly = true)
    public List<TrainingSessionResponse> listSessions(Integer teamId) {
        AccessScope.Visible visible = scope.current();
        List<Integer> teamIds = teamId != null ? List.of(teamId)
                : teamRepository.findAll().stream().map(Team::getTeamId).filter(visible::team).toList();
        if (teamId != null) visible.requireTeam(teamId);
        if (teamIds.isEmpty()) return List.of();
        List<TrainingSession> sessions = sessionRepository.findByTeamIdInOrderBySessionDateDescStartTimeDesc(teamIds);
        Map<Integer, List<AttendanceEntry>> marks = attendanceRepository
                .findByIdSessionIdIn(sessions.stream().map(TrainingSession::getSessionId).toList()).stream()
                .collect(Collectors.groupingBy(a -> a.getId().getSessionId(),
                        Collectors.mapping(a -> new AttendanceEntry(a.getId().getAthleteId(), a.getStatus()), Collectors.toList())));
        return sessions.stream().map(s -> toResponse(s, marks.getOrDefault(s.getSessionId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public TrainingSessionResponse getSession(Integer id) {
        TrainingSession s = load(id);
        return toResponse(s, entries(id));
    }

    public TrainingSessionResponse createSession(TrainingSessionRequest r) {
        scope.current().requireTeam(r.getTeamId());
        if (!teamRepository.existsById(r.getTeamId())) {
            throw new InvalidReferenceException("teamId " + r.getTeamId() + " does not exist");
        }
        if (sessionRepository.existsByTeamIdAndSessionDateAndStartTime(r.getTeamId(), r.getSessionDate(), r.getStartTime())) {
            throw new BusinessRuleViolationException("This team already has a session at that date and time");
        }
        TrainingSession s = new TrainingSession();
        s.setTeamId(r.getTeamId());
        s.setSessionDate(r.getSessionDate());
        s.setStartTime(r.getStartTime());
        s.setLocation(r.getLocation());
        s.setNotes(r.getNotes());
        return toResponse(sessionRepository.save(s), List.of());
    }

    public void deleteSession(Integer id) {
        sessionRepository.delete(load(id));
    }

    /** Sets attendance for the athletes listed. Every athlete must be on the team's active roster. */
    public TrainingSessionResponse recordAttendance(Integer sessionId, AttendanceUpdateRequest request) {
        TrainingSession session = load(sessionId);
        Set<Integer> seen = new HashSet<>();
        for (AttendanceEntry e : request.getEntries()) {
            if (!seen.add(e.getAthleteId())) {
                throw new BusinessRuleViolationException("Athlete " + e.getAthleteId() + " is listed more than once");
            }
            boolean onRoster = rosterRepository.findById(new TeamRosterId(session.getTeamId(), e.getAthleteId()))
                    .map(TeamRoster::getIsActive).orElse(false);
            if (!onRoster) {
                throw new BusinessRuleViolationException("Athlete " + e.getAthleteId() + " is not on this team's active roster");
            }
        }
        for (AttendanceEntry e : request.getEntries()) {
            AttendanceId id = new AttendanceId(sessionId, e.getAthleteId());
            Attendance row = attendanceRepository.findById(id).orElseGet(() -> {
                Attendance a = new Attendance();
                a.setId(id);
                return a;
            });
            row.setStatus(e.getStatus());
            attendanceRepository.save(row);
        }
        return toResponse(session, entries(sessionId));
    }

    /** An athlete's attendance history and rates. Athletes may only see their own. */
    @Transactional(readOnly = true)
    public AttendanceSummaryResponse summaryForAthlete(Integer athleteId) {
        scope.current().requireAthlete(athleteId);
        List<Attendance> rows = attendanceRepository.findByIdAthleteId(athleteId);
        return build(athleteId, rows, sessionsFor(rows), true);
    }

    /** Rates for every athlete the caller may see (no session lists), for dashboards and analytics. */
    @Transactional(readOnly = true)
    public List<AttendanceSummaryResponse> summaryForVisibleAthletes() {
        AccessScope.Visible visible = scope.current();
        List<Attendance> all = attendanceRepository.findAll().stream().filter(a -> visible.athlete(a.getId().getAthleteId())).toList();
        Map<Integer, TrainingSession> sessions = sessionsFor(all);
        return all.stream().collect(Collectors.groupingBy(a -> a.getId().getAthleteId())).entrySet().stream()
                .map(e -> build(e.getKey(), e.getValue(), sessions, false))
                .sorted(Comparator.comparing(AttendanceSummaryResponse::getAthleteId))
                .toList();
    }

    private Map<Integer, TrainingSession> sessionsFor(List<Attendance> rows) {
        return sessionRepository.findAllById(rows.stream().map(a -> a.getId().getSessionId()).distinct().toList())
                .stream().collect(Collectors.toMap(TrainingSession::getSessionId, s -> s));
    }

    private AttendanceSummaryResponse build(Integer athleteId, List<Attendance> rows, Map<Integer, TrainingSession> sessions, boolean withSessions) {
        List<AttendanceSummaryResponse.SessionMark> marks = rows.stream()
                .filter(a -> sessions.containsKey(a.getId().getSessionId()))
                .map(a -> new AttendanceSummaryResponse.SessionMark(sessions.get(a.getId().getSessionId()).getSessionDate(), a.getStatus(), sessions.get(a.getId().getSessionId()).getTeamId()))
                .sorted(Comparator.comparing(AttendanceSummaryResponse.SessionMark::getDate))
                .toList();
        List<AttendanceSummaryResponse.SessionMark> last = marks.size() > 24 ? marks.subList(marks.size() - 24, marks.size()) : marks;

        AttendanceSummaryResponse out = new AttendanceSummaryResponse();
        out.setAthleteId(athleteId);
        out.setTotal(last.size());
        for (AttendanceSummaryResponse.SessionMark m : last) {
            switch (m.getStatus()) {
                case Present -> out.setPresent(out.getPresent() + 1);
                case Late -> out.setLate(out.getLate() + 1);
                case Absent -> out.setAbsent(out.getAbsent() + 1);
                case Excused -> out.setExcused(out.getExcused() + 1);
            }
        }
        out.setRate(rate(last));
        if (last.size() >= 4) {
            int half = last.size() / 2;
            out.setEarlierRate(rate(last.subList(0, half)));
            out.setRecentRate(rate(last.subList(last.size() - half, last.size())));
        }
        out.setSessions(withSessions ? last : List.of());
        return out;
    }

    private static Integer rate(List<AttendanceSummaryResponse.SessionMark> list) {
        if (list.isEmpty()) return null;
        long attended = list.stream().filter(m -> m.getStatus() == AttendanceStatus.Present || m.getStatus() == AttendanceStatus.Late).count();
        return (int) Math.round(attended * 100.0 / list.size());
    }

    private TrainingSession load(Integer id) {
        TrainingSession s = sessionRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Training session not found: " + id));
        scope.current().requireTeam(s.getTeamId());
        return s;
    }

    private List<AttendanceEntry> entries(Integer sessionId) {
        return attendanceRepository.findByIdSessionId(sessionId).stream()
                .map(a -> new AttendanceEntry(a.getId().getAthleteId(), a.getStatus())).toList();
    }

    private TrainingSessionResponse toResponse(TrainingSession s, List<AttendanceEntry> attendance) {
        return new TrainingSessionResponse(s.getSessionId(), s.getTeamId(), s.getSessionDate(), s.getStartTime(), s.getLocation(), s.getNotes(), attendance);
    }
}
