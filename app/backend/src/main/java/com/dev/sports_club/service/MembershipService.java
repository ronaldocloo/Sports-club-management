package com.dev.sports_club.service;

import com.dev.sports_club.dto.MembershipRequest;
import com.dev.sports_club.dto.MembershipResponse;
import com.dev.sports_club.entity.Membership;
import com.dev.sports_club.entity.MembershipStatus;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.AthleteRepository;
import com.dev.sports_club.repository.MembershipRepository;
import com.dev.sports_club.repository.MembershipTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipRepository repository;
    private final AthleteRepository athleteRepository;
    private final MembershipTypeRepository membershipTypeRepository;

    public List<MembershipResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public MembershipResponse findById(Integer id) {
        Membership entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Membership not found: " + id));
        return toResponse(entity);
    }

    public MembershipResponse create(MembershipRequest request) {
        validateReferences(request);
        MembershipStatus status = request.getStatus() != null ? request.getStatus() : MembershipStatus.Active;
        if (status == MembershipStatus.Active
                && repository.existsByAthleteIdAndStatus(request.getAthleteId(), MembershipStatus.Active)) {
            throw new BusinessRuleViolationException("An athlete cannot hold more than one active membership");
        }
        Membership entity = new Membership();
        applyRequest(entity, request);
        entity.setStatus(status);
        return toResponse(repository.save(entity));
    }

    public MembershipResponse update(Integer id, MembershipRequest request) {
        validateReferences(request);
        Membership entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Membership not found: " + id));
        MembershipStatus newStatus = request.getStatus() != null ? request.getStatus() : entity.getStatus();
        if (newStatus == MembershipStatus.Active
                && repository.existsByAthleteIdAndStatusAndMembershipIdNot(request.getAthleteId(), MembershipStatus.Active, id)) {
            throw new BusinessRuleViolationException("An athlete cannot hold more than one active membership");
        }
        applyRequest(entity, request);
        if (request.getStatus() != null) {
            entity.setStatus(newStatus);
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateReferences(MembershipRequest request) {
        if (!athleteRepository.existsById(request.getAthleteId())) {
            throw new InvalidReferenceException("athleteId " + request.getAthleteId() + " does not exist");
        }
        if (!membershipTypeRepository.existsById(request.getTypeId())) {
            throw new InvalidReferenceException("typeId " + request.getTypeId() + " does not exist");
        }
    }

    private void applyRequest(Membership entity, MembershipRequest request) {
        entity.setAthleteId(request.getAthleteId());
        entity.setTypeId(request.getTypeId());
        entity.setStartDate(request.getStartDate());
        entity.setEndDate(request.getEndDate());
        entity.setAmountCharged(request.getAmountCharged());
    }

    private MembershipResponse toResponse(Membership entity) {
        return new MembershipResponse(
                entity.getMembershipId(),
                entity.getAthleteId(),
                entity.getTypeId(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getAmountCharged(),
                entity.getStatus()
        );
    }
}
