package com.dev.sports_club.service;

import com.dev.sports_club.dto.CompetitionRequest;
import com.dev.sports_club.dto.CompetitionResponse;
import com.dev.sports_club.entity.Competition;
import com.dev.sports_club.repository.CompetitionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionRepository repository;

    public List<CompetitionResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CompetitionResponse findById(Integer id) {
        Competition entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Competition not found: " + id));
        return toResponse(entity);
    }

    public CompetitionResponse create(CompetitionRequest request) {
        Competition entity = new Competition();
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public CompetitionResponse update(Integer id, CompetitionRequest request) {
        Competition entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Competition not found: " + id));
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void applyRequest(Competition entity, CompetitionRequest request) {
        entity.setCompName(request.getCompName());
        entity.setCompDate(request.getCompDate());
        entity.setVenue(request.getVenue());
        entity.setLevel(request.getLevel());
        entity.setRegistrationDeadline(request.getRegistrationDeadline());
    }

    private CompetitionResponse toResponse(Competition entity) {
        return new CompetitionResponse(
                entity.getCompetitionId(),
                entity.getCompName(),
                entity.getCompDate(),
                entity.getVenue(),
                entity.getLevel(),
                entity.getRegistrationDeadline()
        );
    }
}
