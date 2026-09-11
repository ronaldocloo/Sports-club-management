package com.dev.sports_club.service;

import com.dev.sports_club.dto.TeamCompetitionRequest;
import com.dev.sports_club.dto.TeamCompetitionResponse;
import com.dev.sports_club.entity.TeamCompetition;
import com.dev.sports_club.entity.TeamCompetitionId;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.CompetitionRepository;
import com.dev.sports_club.repository.TeamCompetitionRepository;
import com.dev.sports_club.repository.TeamRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamCompetitionService {

    private final TeamCompetitionRepository repository;
    private final TeamRepository teamRepository;
    private final CompetitionRepository competitionRepository;

    public List<TeamCompetitionResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public TeamCompetitionResponse findById(Integer teamId, Integer competitionId) {
        TeamCompetition entity = repository.findById(new TeamCompetitionId(teamId, competitionId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "TeamCompetition not found: teamId=" + teamId + ", competitionId=" + competitionId));
        return toResponse(entity);
    }

    public TeamCompetitionResponse create(TeamCompetitionRequest request) {
        validateReferences(request);
        TeamCompetition entity = new TeamCompetition();
        entity.setId(new TeamCompetitionId(request.getTeamId(), request.getCompetitionId()));
        entity.setRegistrationDate(request.getRegistrationDate() != null ? request.getRegistrationDate() : LocalDate.now());
        entity.setFinalPosition(request.getFinalPosition());
        entity.setPointsScored(request.getPointsScored());
        return toResponse(repository.save(entity));
    }

    public TeamCompetitionResponse update(Integer teamId, Integer competitionId, TeamCompetitionRequest request) {
        TeamCompetition entity = repository.findById(new TeamCompetitionId(teamId, competitionId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "TeamCompetition not found: teamId=" + teamId + ", competitionId=" + competitionId));
        entity.setFinalPosition(request.getFinalPosition());
        entity.setPointsScored(request.getPointsScored());
        if (request.getRegistrationDate() != null) {
            entity.setRegistrationDate(request.getRegistrationDate());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer teamId, Integer competitionId) {
        repository.deleteById(new TeamCompetitionId(teamId, competitionId));
    }

    private void validateReferences(TeamCompetitionRequest request) {
        if (!teamRepository.existsById(request.getTeamId())) {
            throw new InvalidReferenceException("teamId " + request.getTeamId() + " does not exist");
        }
        if (!competitionRepository.existsById(request.getCompetitionId())) {
            throw new InvalidReferenceException("competitionId " + request.getCompetitionId() + " does not exist");
        }
    }

    private TeamCompetitionResponse toResponse(TeamCompetition entity) {
        return new TeamCompetitionResponse(
                entity.getId().getTeamId(),
                entity.getId().getCompetitionId(),
                entity.getRegistrationDate(),
                entity.getFinalPosition(),
                entity.getPointsScored()
        );
    }
}
