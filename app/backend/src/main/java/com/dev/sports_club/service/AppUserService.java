package com.dev.sports_club.service;

import com.dev.sports_club.dto.AppUserRequest;
import com.dev.sports_club.dto.AppUserResponse;
import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.repository.CoachRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository repository;
    private final CoachRepository coachRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AppUserResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public AppUserResponse findById(Integer id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + id));
        return toResponse(entity);
    }

    public AppUserResponse create(AppUserRequest request) {
        validateCoachReference(request);
        AppUser entity = new AppUser();
        entity.setUsername(request.getUsername());
        entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        entity.setRole(request.getRole());
        entity.setCoachId(request.getCoachId());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        return toResponse(repository.save(entity));
    }

    public AppUserResponse update(Integer id, AppUserRequest request) {
        validateCoachReference(request);
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + id));
        entity.setUsername(request.getUsername());
        entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        entity.setRole(request.getRole());
        entity.setCoachId(request.getCoachId());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateCoachReference(AppUserRequest request) {
        if (request.getCoachId() != null && !coachRepository.existsById(request.getCoachId())) {
            throw new InvalidReferenceException("coachId " + request.getCoachId() + " does not exist");
        }
    }

    private AppUserResponse toResponse(AppUser entity) {
        return new AppUserResponse(
                entity.getUserId(),
                entity.getUsername(),
                entity.getRole(),
                entity.getCoachId(),
                entity.getIsActive(),
                entity.getLastLogin()
        );
    }
}
