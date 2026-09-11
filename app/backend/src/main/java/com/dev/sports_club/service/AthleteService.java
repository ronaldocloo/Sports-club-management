package com.dev.sports_club.service;

import com.dev.sports_club.dto.AthleteRequest;
import com.dev.sports_club.dto.AthleteResponse;
import com.dev.sports_club.entity.Athlete;
import com.dev.sports_club.repository.AthleteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AthleteService {

    private final AthleteRepository repository;

    public List<AthleteResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public AthleteResponse findById(Integer id) {
        Athlete entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Athlete not found: " + id));
        return toResponse(entity);
    }

    public AthleteResponse create(AthleteRequest request) {
        Athlete entity = new Athlete();
        applyRequest(entity, request);
        entity.setJoinDate(request.getJoinDate() != null ? request.getJoinDate() : LocalDate.now());
        return toResponse(repository.save(entity));
    }

    public AthleteResponse update(Integer id, AthleteRequest request) {
        Athlete entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Athlete not found: " + id));
        applyRequest(entity, request);
        if (request.getJoinDate() != null) {
            entity.setJoinDate(request.getJoinDate());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void applyRequest(Athlete entity, AthleteRequest request) {
        entity.setFirstName(request.getFirstName());
        entity.setLastName(request.getLastName());
        entity.setDateOfBirth(request.getDateOfBirth());
        entity.setGender(request.getGender());
        entity.setEmail(request.getEmail());
        entity.setPhone(request.getPhone());
    }

    private AthleteResponse toResponse(Athlete entity) {
        return new AthleteResponse(
                entity.getAthleteId(),
                entity.getFirstName(),
                entity.getLastName(),
                entity.getDateOfBirth(),
                entity.getGender(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getJoinDate()
        );
    }
}
