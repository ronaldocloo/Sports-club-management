package com.dev.sports_club.service;

import com.dev.sports_club.dto.TeamRequest;
import com.dev.sports_club.dto.TeamResponse;
import com.dev.sports_club.entity.Team;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.CoachRepository;
import com.dev.sports_club.repository.SportRepository;
import com.dev.sports_club.repository.TeamRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository repository;
    private final SportRepository sportRepository;
    private final CoachRepository coachRepository;

    public List<TeamResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public TeamResponse findById(Integer id) {
        Team entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Team not found: " + id));
        return toResponse(entity);
    }

    public TeamResponse create(TeamRequest request) {
        validateReferences(request);
        Team entity = new Team();
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public TeamResponse update(Integer id, TeamRequest request) {
        validateReferences(request);
        Team entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Team not found: " + id));
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateReferences(TeamRequest request) {
        if (!sportRepository.existsById(request.getSportId())) {
            throw new InvalidReferenceException("sportId " + request.getSportId() + " does not exist");
        }
        if (!coachRepository.existsById(request.getCoachId())) {
            throw new InvalidReferenceException("coachId " + request.getCoachId() + " does not exist");
        }
    }

    private void applyRequest(Team entity, TeamRequest request) {
        entity.setTeamName(request.getTeamName());
        entity.setSportId(request.getSportId());
        entity.setCoachId(request.getCoachId());
        entity.setFoundedDate(request.getFoundedDate());
    }

    private TeamResponse toResponse(Team entity) {
        return new TeamResponse(
                entity.getTeamId(),
                entity.getTeamName(),
                entity.getSportId(),
                entity.getCoachId(),
                entity.getFoundedDate()
        );
    }
}
