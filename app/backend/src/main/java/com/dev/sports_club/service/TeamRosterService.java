package com.dev.sports_club.service;

import com.dev.sports_club.dto.TeamRosterRequest;
import com.dev.sports_club.dto.TeamRosterResponse;
import com.dev.sports_club.entity.MembershipStatus;
import com.dev.sports_club.entity.TeamRoster;
import com.dev.sports_club.entity.TeamRosterId;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.AthleteRepository;
import com.dev.sports_club.repository.MembershipRepository;
import com.dev.sports_club.repository.TeamRepository;
import com.dev.sports_club.repository.TeamRosterRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamRosterService {

    private final TeamRosterRepository repository;
    private final TeamRepository teamRepository;
    private final AthleteRepository athleteRepository;
    private final MembershipRepository membershipRepository;

    public List<TeamRosterResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public TeamRosterResponse findById(Integer teamId, Integer athleteId) {
        TeamRoster entity = repository.findById(new TeamRosterId(teamId, athleteId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "TeamRoster not found: teamId=" + teamId + ", athleteId=" + athleteId));
        return toResponse(entity);
    }

    public TeamRosterResponse create(TeamRosterRequest request) {
        validateReferences(request);
        if (!membershipRepository.hasCurrentActiveMembership(request.getAthleteId(), MembershipStatus.Active)) {
            throw new BusinessRuleViolationException(
                    "Athlete requires a current active membership before joining a team");
        }
        TeamRoster entity = new TeamRoster();
        entity.setId(new TeamRosterId(request.getTeamId(), request.getAthleteId()));
        entity.setDateJoined(request.getDateJoined() != null ? request.getDateJoined() : LocalDate.now());
        entity.setPosition(request.getPosition());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        return toResponse(repository.save(entity));
    }

    public TeamRosterResponse update(Integer teamId, Integer athleteId, TeamRosterRequest request) {
        TeamRoster entity = repository.findById(new TeamRosterId(teamId, athleteId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "TeamRoster not found: teamId=" + teamId + ", athleteId=" + athleteId));
        entity.setPosition(request.getPosition());
        if (request.getDateJoined() != null) {
            entity.setDateJoined(request.getDateJoined());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer teamId, Integer athleteId) {
        repository.deleteById(new TeamRosterId(teamId, athleteId));
    }

    private void validateReferences(TeamRosterRequest request) {
        if (!teamRepository.existsById(request.getTeamId())) {
            throw new InvalidReferenceException("teamId " + request.getTeamId() + " does not exist");
        }
        if (!athleteRepository.existsById(request.getAthleteId())) {
            throw new InvalidReferenceException("athleteId " + request.getAthleteId() + " does not exist");
        }
    }

    private TeamRosterResponse toResponse(TeamRoster entity) {
        return new TeamRosterResponse(
                entity.getId().getTeamId(),
                entity.getId().getAthleteId(),
                entity.getDateJoined(),
                entity.getPosition(),
                entity.getIsActive()
        );
    }
}
