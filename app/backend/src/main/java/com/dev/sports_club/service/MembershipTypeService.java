package com.dev.sports_club.service;

import com.dev.sports_club.dto.MembershipTypeRequest;
import com.dev.sports_club.dto.MembershipTypeResponse;
import com.dev.sports_club.entity.MembershipType;
import com.dev.sports_club.repository.MembershipTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MembershipTypeService {

    private final MembershipTypeRepository repository;

    public List<MembershipTypeResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public MembershipTypeResponse findById(Integer id) {
        MembershipType entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MembershipType not found: " + id));
        return toResponse(entity);
    }

    public MembershipTypeResponse create(MembershipTypeRequest request) {
        MembershipType entity = new MembershipType();
        entity.setTypeName(request.getTypeName());
        entity.setFee(request.getFee());
        entity.setDurationMonths(request.getDurationMonths());
        entity.setDescription(request.getDescription());
        return toResponse(repository.save(entity));
    }

    public MembershipTypeResponse update(Integer id, MembershipTypeRequest request) {
        MembershipType entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MembershipType not found: " + id));
        entity.setTypeName(request.getTypeName());
        entity.setFee(request.getFee());
        entity.setDurationMonths(request.getDurationMonths());
        entity.setDescription(request.getDescription());
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private MembershipTypeResponse toResponse(MembershipType entity) {
        return new MembershipTypeResponse(
                entity.getTypeId(),
                entity.getTypeName(),
                entity.getFee(),
                entity.getDurationMonths(),
                entity.getDescription()
        );
    }
}
