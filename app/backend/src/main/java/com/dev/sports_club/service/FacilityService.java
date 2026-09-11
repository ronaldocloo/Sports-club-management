package com.dev.sports_club.service;

import com.dev.sports_club.dto.FacilityRequest;
import com.dev.sports_club.dto.FacilityResponse;
import com.dev.sports_club.entity.Facility;
import com.dev.sports_club.entity.FacilityStatus;
import com.dev.sports_club.repository.FacilityRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository repository;

    public List<FacilityResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public FacilityResponse findById(Integer id) {
        Facility entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facility not found: " + id));
        return toResponse(entity);
    }

    public FacilityResponse create(FacilityRequest request) {
        Facility entity = new Facility();
        entity.setFacilityName(request.getFacilityName());
        entity.setFacilityType(request.getFacilityType());
        entity.setCapacity(request.getCapacity());
        entity.setLocation(request.getLocation());
        entity.setStatus(request.getStatus() != null ? request.getStatus() : FacilityStatus.Available);
        return toResponse(repository.save(entity));
    }

    public FacilityResponse update(Integer id, FacilityRequest request) {
        Facility entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facility not found: " + id));
        entity.setFacilityName(request.getFacilityName());
        entity.setFacilityType(request.getFacilityType());
        entity.setCapacity(request.getCapacity());
        entity.setLocation(request.getLocation());
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private FacilityResponse toResponse(Facility entity) {
        return new FacilityResponse(
                entity.getFacilityId(),
                entity.getFacilityName(),
                entity.getFacilityType(),
                entity.getCapacity(),
                entity.getLocation(),
                entity.getStatus()
        );
    }
}
