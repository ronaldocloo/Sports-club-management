package com.dev.sports_club.service;

import com.dev.sports_club.dto.CoachRequest;
import com.dev.sports_club.dto.CoachResponse;
import com.dev.sports_club.entity.Coach;
import com.dev.sports_club.repository.CoachRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoachService {

    private final CoachRepository repository;

    public List<CoachResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CoachResponse findById(Integer id) {
        Coach entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Coach not found: " + id));
        return toResponse(entity);
    }

    public CoachResponse create(CoachRequest request) {
        Coach entity = new Coach();
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public CoachResponse update(Integer id, CoachRequest request) {
        Coach entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Coach not found: " + id));
        applyRequest(entity, request);
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void applyRequest(Coach entity, CoachRequest request) {
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setSpecialty(request.getSpecialty());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
        entity.setHireDate(request.getHireDate());
    }

    private CoachResponse toResponse(Coach entity) {
        return new CoachResponse(
                entity.getCoachId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getSpecialty(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getHireDate()
        );
    }
}
