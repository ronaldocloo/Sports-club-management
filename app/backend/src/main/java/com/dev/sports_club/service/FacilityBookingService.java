package com.dev.sports_club.service;

import com.dev.sports_club.dto.FacilityBookingRequest;
import com.dev.sports_club.dto.FacilityBookingResponse;
import com.dev.sports_club.entity.BookingStatus;
import com.dev.sports_club.entity.FacilityBooking;
import com.dev.sports_club.exception.BookingConflictException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.FacilityBookingRepository;
import com.dev.sports_club.repository.FacilityRepository;
import com.dev.sports_club.repository.TeamRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityBookingService {

    private final FacilityBookingRepository repository;
    private final FacilityRepository facilityRepository;
    private final TeamRepository teamRepository;

    public List<FacilityBookingResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public FacilityBookingResponse findById(Integer id) {
        FacilityBooking entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("FacilityBooking not found: " + id));
        return toResponse(entity);
    }

    public FacilityBookingResponse create(FacilityBookingRequest request) {
        validateReferences(request);
        if (repository.existsByFacilityIdAndBookingDateAndTimeSlot(
                request.getFacilityId(), request.getBookingDate(), request.getTimeSlot())) {
            throw new BookingConflictException("This facility is already booked for that date and time slot");
        }
        FacilityBooking entity = new FacilityBooking();
        applyRequest(entity, request);
        entity.setStatus(request.getStatus() != null ? request.getStatus() : BookingStatus.Confirmed);
        entity.setCreatedAt(LocalDateTime.now());
        return toResponse(repository.save(entity));
    }

    public FacilityBookingResponse update(Integer id, FacilityBookingRequest request) {
        validateReferences(request);
        FacilityBooking entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("FacilityBooking not found: " + id));
        if (repository.existsByFacilityIdAndBookingDateAndTimeSlotAndBookingIdNot(
                request.getFacilityId(), request.getBookingDate(), request.getTimeSlot(), id)) {
            throw new BookingConflictException("This facility is already booked for that date and time slot");
        }
        applyRequest(entity, request);
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateReferences(FacilityBookingRequest request) {
        if (!facilityRepository.existsById(request.getFacilityId())) {
            throw new InvalidReferenceException("facilityId " + request.getFacilityId() + " does not exist");
        }
        if (!teamRepository.existsById(request.getTeamId())) {
            throw new InvalidReferenceException("teamId " + request.getTeamId() + " does not exist");
        }
    }

    private void applyRequest(FacilityBooking entity, FacilityBookingRequest request) {
        entity.setFacilityId(request.getFacilityId());
        entity.setTeamId(request.getTeamId());
        entity.setBookingDate(request.getBookingDate());
        entity.setTimeSlot(request.getTimeSlot());
        entity.setPurpose(request.getPurpose());
    }

    private FacilityBookingResponse toResponse(FacilityBooking entity) {
        return new FacilityBookingResponse(
                entity.getBookingId(),
                entity.getFacilityId(),
                entity.getTeamId(),
                entity.getBookingDate(),
                entity.getTimeSlot(),
                entity.getPurpose(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }
}
