package com.dev.sports_club.service;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.entity.*;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.*;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    private final ClubEventRepository repository;

    @Transactional(readOnly = true)
    public List<EventResponse> findAll() {
        return repository.findAllByOrderByEventDateAscStartTimeAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EventResponse findById(Integer id) {
        return toResponse(load(id));
    }

    public EventResponse create(EventRequest request) {
        validate(request);
        ClubEvent e = new ClubEvent();
        apply(e, request);
        e.setStatus(request.getStatus() != null ? request.getStatus() : EventStatus.Scheduled);
        return toResponse(repository.save(e));
    }

    public EventResponse update(Integer id, EventRequest request) {
        validate(request);
        ClubEvent e = load(id);
        apply(e, request);
        if (request.getStatus() != null) e.setStatus(request.getStatus());
        return toResponse(repository.save(e));
    }

    public void delete(Integer id) {
        repository.delete(load(id));
    }

    private void validate(EventRequest r) {
        if (r.getStartTime() != null && r.getEndTime() != null && !r.getEndTime().isAfter(r.getStartTime())) {
            throw new BusinessRuleViolationException("The end time must be after the start time");
        }
    }

    private void apply(ClubEvent e, EventRequest r) {
        e.setTitle(r.getTitle().trim());
        e.setEventType(r.getEventType());
        e.setEventDate(r.getEventDate());
        e.setStartTime(r.getStartTime());
        e.setEndTime(r.getEndTime());
        e.setLocation(r.getLocation());
        e.setOrganizer(r.getOrganizer());
        e.setDescription(r.getDescription());
    }

    private ClubEvent load(Integer id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
    }

    private EventResponse toResponse(ClubEvent e) {
        return new EventResponse(e.getEventId(), e.getTitle(), e.getEventType(), e.getEventDate(), e.getStartTime(), e.getEndTime(),
                e.getLocation(), e.getOrganizer(), e.getDescription(), e.getStatus());
    }
}
