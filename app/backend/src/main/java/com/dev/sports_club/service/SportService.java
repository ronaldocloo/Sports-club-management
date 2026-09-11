package com.dev.sports_club.service;

import com.dev.sports_club.dto.SportRequest;
import com.dev.sports_club.dto.SportResponse;
import com.dev.sports_club.entity.Sport;
import com.dev.sports_club.repository.SportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SportService {

    private final SportRepository repository;

    public List<SportResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public SportResponse findById(Integer id) {
        Sport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sport not found: " + id));
        return toResponse(entity);
    }

    public SportResponse create(SportRequest request) {
        Sport entity = new Sport();
        entity.setSportName(request.getSportName());
        entity.setDescription(request.getDescription());
        return toResponse(repository.save(entity));
    }

    public SportResponse update(Integer id, SportRequest request) {
        Sport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sport not found: " + id));
        entity.setSportName(request.getSportName());
        entity.setDescription(request.getDescription());
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private SportResponse toResponse(Sport entity) {
        return new SportResponse(
                entity.getSportId(),
                entity.getSportName(),
                entity.getDescription()
        );
    }
}
