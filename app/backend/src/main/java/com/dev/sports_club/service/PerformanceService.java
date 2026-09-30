package com.dev.sports_club.service;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.*;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
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

/** Performance ratings and sport-specific stats per athlete. */
@Service
@RequiredArgsConstructor
@Transactional
public class PerformanceService {

    private final PerformanceRecordRepository repository;
    private final AthleteRepository athleteRepository;
    private final TeamRosterRepository rosterRepository;
    private final FixtureRepository fixtureRepository;
    private final AccessScope scope;
    private final ObjectMapper json;

    @Transactional(readOnly = true)
    public List<PerformanceResponse> list(Integer athleteId) {
        AccessScope.Visible visible = scope.current();
        if (athleteId != null) {
            visible.requireAthlete(athleteId);
            return repository.findByAthleteIdOrderByRecordDateAsc(athleteId).stream().map(this::toResponse).toList();
        }
        return repository.findAllByOrderByRecordDateDesc().stream().filter(r -> visible.athlete(r.getAthleteId())).map(this::toResponse).toList();
    }

    public PerformanceResponse create(PerformanceRequest request) {
        check(request);
        PerformanceRecord r = new PerformanceRecord();
        apply(r, request);
        return toResponse(repository.save(r));
    }

    public PerformanceResponse update(Integer id, PerformanceRequest request) {
        check(request);
        PerformanceRecord r = load(id);
        apply(r, request);
        return toResponse(repository.save(r));
    }

    public void delete(Integer id) {
        repository.delete(load(id));
    }

    /** Trend, average rating, summed stats, and games played/won by the athlete's teams. */
    @Transactional(readOnly = true)
    public PerformanceSummaryResponse summary(Integer athleteId) {
        scope.current().requireAthlete(athleteId);
        List<PerformanceRecord> all = repository.findByAthleteIdOrderByRecordDateAsc(athleteId);
        PerformanceSummaryResponse out = new PerformanceSummaryResponse();
        out.setAthleteId(athleteId);
        List<PerformanceRecord> recent = all.size() > 8 ? all.subList(all.size() - 8, all.size()) : all;
        out.setRecent(recent.stream().map(this::toResponse).toList());
        out.setAverageRating(all.isEmpty() ? null : round1(all.stream().mapToDouble(r -> r.getRating().doubleValue()).average().orElse(0)));
        out.setLatestRating(all.isEmpty() ? null : all.get(all.size() - 1).getRating().doubleValue());
        Map<String, Double> totals = new TreeMap<>();
        all.forEach(r -> parse(r.getStats()).forEach((k, v) -> totals.merge(k, v, Double::sum)));
        out.setStatTotals(totals);

        Set<Integer> teams = rosterRepository.findByIdAthleteId(athleteId).stream().map(t -> t.getId().getTeamId()).collect(Collectors.toSet());
        int games = 0;
        int wins = 0;
        for (Fixture f : fixtureRepository.findByStatus(FixtureStatus.Completed)) {
            boolean home = teams.contains(f.getHomeTeamId());
            boolean away = teams.contains(f.getAwayTeamId());
            if (!home && !away) continue;
            games++;
            if ((home && f.getHomeScore() > f.getAwayScore()) || (away && f.getAwayScore() > f.getHomeScore())) wins++;
        }
        out.setGamesPlayed(games);
        out.setWins(wins);
        return out;
    }

    private void check(PerformanceRequest r) {
        scope.current().requireAthlete(r.getAthleteId());
        if (!athleteRepository.existsById(r.getAthleteId())) {
            throw new InvalidReferenceException("athleteId " + r.getAthleteId() + " does not exist");
        }
        if (r.getStats() != null && r.getStats().size() > 20) {
            throw new BusinessRuleViolationException("At most 20 stats can be recorded per entry");
        }
    }

    private void apply(PerformanceRecord r, PerformanceRequest request) {
        r.setAthleteId(request.getAthleteId());
        r.setRecordDate(request.getRecordDate());
        r.setRating(request.getRating());
        r.setNotes(request.getNotes());
        r.setStats(request.getStats() == null || request.getStats().isEmpty() ? null : json.writeValueAsString(request.getStats()));
    }

    private PerformanceRecord load(Integer id) {
        PerformanceRecord r = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Performance record not found: " + id));
        scope.current().requireAthlete(r.getAthleteId());
        return r;
    }

    private Map<String, Double> parse(String stats) {
        if (stats == null || stats.isBlank()) return Map.of();
        return json.readValue(stats, new TypeReference<Map<String, Double>>() { });
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private PerformanceResponse toResponse(PerformanceRecord r) {
        return new PerformanceResponse(r.getRecordId(), r.getAthleteId(), r.getRecordDate(), r.getRating(), parse(r.getStats()), r.getNotes());
    }
}
