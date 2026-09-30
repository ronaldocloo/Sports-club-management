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

@Service
@RequiredArgsConstructor
@Transactional
public class FixtureService {

    private final FixtureRepository repository;
    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;
    private final TeamCompetitionRepository teamCompetitionRepository;
    private final AccessScope scope;
    private final NotificationService notifications;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public List<FixtureResponse> findAll(Integer competitionId) {
        List<Fixture> list = competitionId != null
                ? repository.findByCompetitionIdOrderByMatchDateAscMatchTimeAsc(competitionId)
                : repository.findAllByOrderByMatchDateAscMatchTimeAsc();
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FixtureResponse findById(Integer id) {
        return toResponse(load(id));
    }

    public FixtureResponse create(FixtureRequest request) {
        validate(request);
        Fixture f = new Fixture();
        apply(f, request);
        f.setStatus(request.getStatus() != null && request.getStatus() != FixtureStatus.Completed ? request.getStatus() : FixtureStatus.Scheduled);
        return toResponse(repository.save(f));
    }

    public FixtureResponse update(Integer id, FixtureRequest request) {
        validate(request);
        Fixture f = load(id);
        if (f.getStatus() == FixtureStatus.Completed) {
            throw new BusinessRuleViolationException("A completed fixture cannot be edited; correct its result instead");
        }
        apply(f, request);
        if (request.getStatus() != null && request.getStatus() != FixtureStatus.Completed) {
            f.setStatus(request.getStatus());
        }
        return toResponse(repository.save(f));
    }

    public void delete(Integer id) {
        Fixture f = load(id);
        repository.delete(f);
        syncPoints(f.getCompetitionId());
    }

    /** Records (or corrects) a result, then refreshes the competition points of both teams. */
    public FixtureResponse recordResult(Integer id, FixtureResultRequest request) {
        Fixture f = load(id);
        AccessScope.Visible visible = scope.current();
        if (!visible.team(f.getHomeTeamId()) && !visible.team(f.getAwayTeamId())) {
            throw new AccessDeniedException("You can only record results for your own teams");
        }
        if (f.getStatus() == FixtureStatus.Cancelled) {
            throw new BusinessRuleViolationException("A cancelled fixture cannot have a result");
        }
        f.setHomeScore(request.getHomeScore());
        f.setAwayScore(request.getAwayScore());
        f.setStatus(FixtureStatus.Completed);
        repository.save(f);
        syncPoints(f.getCompetitionId());
        announce(f);
        return toResponse(f);
    }

    /** League table from completed group-stage fixtures (3 points for a win, 1 for a draw). */
    @Transactional(readOnly = true)
    public List<StandingResponse> standings(Integer competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw new EntityNotFoundException("Competition not found: " + competitionId);
        }
        return computeStandings(competitionId);
    }

    // ---------------------------------------------------------------- internals

    private List<StandingResponse> computeStandings(Integer competitionId) {
        List<TeamCompetition> entries = teamCompetitionRepository.findByIdCompetitionId(competitionId);
        Map<Integer, String> names = teamRepository.findAllById(entries.stream().map(e -> e.getId().getTeamId()).toList())
                .stream().collect(Collectors.toMap(Team::getTeamId, Team::getTeamName));
        Map<Integer, StandingResponse> table = new LinkedHashMap<>();
        entries.forEach(e -> {
            StandingResponse s = new StandingResponse();
            s.setTeamId(e.getId().getTeamId());
            s.setTeamName(names.getOrDefault(e.getId().getTeamId(), "Team " + e.getId().getTeamId()));
            table.put(s.getTeamId(), s);
        });
        for (Fixture f : repository.findByCompetitionIdOrderByMatchDateAscMatchTimeAsc(competitionId)) {
            if (f.getStatus() != FixtureStatus.Completed || isKnockout(f.getRoundLabel())) continue;
            StandingResponse home = table.get(f.getHomeTeamId());
            StandingResponse away = table.get(f.getAwayTeamId());
            if (home == null || away == null) continue;
            tally(home, f.getHomeScore(), f.getAwayScore());
            tally(away, f.getAwayScore(), f.getHomeScore());
        }
        return table.values().stream()
                .sorted(Comparator.comparingInt(StandingResponse::getPoints).reversed()
                        .thenComparing(Comparator.comparingInt((StandingResponse s) -> s.getGoalsFor() - s.getGoalsAgainst()).reversed())
                        .thenComparing(Comparator.comparingInt(StandingResponse::getGoalsFor).reversed())
                        .thenComparing(StandingResponse::getTeamName))
                .toList();
    }

    private static void tally(StandingResponse s, int scored, int conceded) {
        s.setPlayed(s.getPlayed() + 1);
        s.setGoalsFor(s.getGoalsFor() + scored);
        s.setGoalsAgainst(s.getGoalsAgainst() + conceded);
        if (scored > conceded) { s.setWon(s.getWon() + 1); s.setPoints(s.getPoints() + 3); }
        else if (scored == conceded) { s.setDrawn(s.getDrawn() + 1); s.setPoints(s.getPoints() + 1); }
        else { s.setLost(s.getLost() + 1); }
    }

    static boolean isKnockout(String label) {
        String l = label == null ? "" : label.toLowerCase(Locale.ROOT);
        return l.contains("final") || l.contains("third") || l.contains("play-off") || l.contains("playoff");
    }

    /** Keeps team_competition.points_scored in step with the standings. */
    private void syncPoints(Integer competitionId) {
        for (StandingResponse s : computeStandings(competitionId)) {
            teamCompetitionRepository.findById(new TeamCompetitionId(s.getTeamId(), competitionId)).ifPresent(tc -> {
                tc.setPointsScored(s.getPoints());
                teamCompetitionRepository.save(tc);
            });
        }
    }

    private void announce(Fixture f) {
        Map<Integer, String> names = teamRepository.findAllById(List.of(f.getHomeTeamId(), f.getAwayTeamId())).stream()
                .collect(Collectors.toMap(Team::getTeamId, Team::getTeamName));
        String text = "Result: " + names.get(f.getHomeTeamId()) + " " + f.getHomeScore() + "–" + f.getAwayScore() + " " + names.get(f.getAwayTeamId());
        String link = "/competitions/" + f.getCompetitionId();
        String key = "fixture-result:" + f.getFixtureId() + ":" + f.getHomeScore() + "-" + f.getAwayScore();
        notifications.notifyRoles(f.getOrganizationId(), List.of(AppUserRole.Admin), NotificationKind.fixture, text, link, key);
        Set<Integer> coachIds = teamRepository.findAllById(List.of(f.getHomeTeamId(), f.getAwayTeamId())).stream()
                .map(Team::getCoachId).collect(Collectors.toSet());
        coachIds.forEach(cid -> notifications.notifyUsers(userRepository.findByCoachIdAndIsActiveTrue(cid), NotificationKind.fixture, text, link, key));
    }

    private void validate(FixtureRequest r) {
        if (!competitionRepository.existsById(r.getCompetitionId())) {
            throw new InvalidReferenceException("competitionId " + r.getCompetitionId() + " does not exist");
        }
        for (Integer teamId : List.of(r.getHomeTeamId(), r.getAwayTeamId())) {
            if (!teamRepository.existsById(teamId)) {
                throw new InvalidReferenceException("teamId " + teamId + " does not exist");
            }
            if (!teamCompetitionRepository.existsById(new TeamCompetitionId(teamId, r.getCompetitionId()))) {
                throw new BusinessRuleViolationException("Team " + teamId + " is not registered in this competition");
            }
        }
        if (r.getHomeTeamId().equals(r.getAwayTeamId())) {
            throw new BusinessRuleViolationException("A team cannot play itself");
        }
    }

    private void apply(Fixture f, FixtureRequest r) {
        f.setCompetitionId(r.getCompetitionId());
        f.setHomeTeamId(r.getHomeTeamId());
        f.setAwayTeamId(r.getAwayTeamId());
        f.setRoundLabel(r.getRoundLabel() == null || r.getRoundLabel().isBlank() ? "Group Stage" : r.getRoundLabel().trim());
        f.setVenue(r.getVenue());
        f.setMatchDate(r.getMatchDate());
        f.setMatchTime(r.getMatchTime());
        f.setOfficials(r.getOfficials());
    }

    private Fixture load(Integer id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Fixture not found: " + id));
    }

    private FixtureResponse toResponse(Fixture f) {
        return new FixtureResponse(f.getFixtureId(), f.getCompetitionId(), f.getHomeTeamId(), f.getAwayTeamId(), f.getRoundLabel(),
                f.getVenue(), f.getMatchDate(), f.getMatchTime(), f.getOfficials(), f.getStatus(), f.getHomeScore(), f.getAwayScore());
    }
}
