package com.dev.sports_club.service;

import com.dev.sports_club.dto.AppUserRequest;
import com.dev.sports_club.dto.ChangePasswordRequest;
import com.dev.sports_club.entity.AppUserRole;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.repository.AthleteRepository;
import com.dev.sports_club.tenant.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository repository;
    private final CoachRepository coachRepository;
    private final AthleteRepository athleteRepository;
    private final PasswordEncoder passwordEncoder;

    /** Users of the caller's organization. A Super Admin with no organization selected sees everyone. */
    public List<AppUserResponse> findAll() {
        return repository.findAll().stream()
                .filter(this::inCallerOrganization)
                .map(this::toResponse)
                .toList();
    }

    public AppUserResponse findById(Integer id) {
        return toResponse(load(id));
    }

    private AppUser load(Integer id) {
        AppUser entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + id));
        if (!inCallerOrganization(entity)) {
            throw new EntityNotFoundException("AppUser not found: " + id);
        }
        return entity;
    }

    // AppUser is not tenant-filtered (usernames are global so login works), so scope it by hand.
    private boolean inCallerOrganization(AppUser user) {
        if (!TenantContext.hasOrganization()) {
            return actorIsSuperAdmin();
        }
        return Objects.equals(user.getOrganizationId(), TenantContext.get());
    }

    private boolean actorIsSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SuperAdmin"));
    }

    public AppUserResponse create(AppUserRequest request) {
        validateReferences(request);
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessRuleViolationException("A password of at least 8 characters is required for a new user");
        }
        if (repository.findByUsername(request.getUsername()).isPresent()) {
            throw new BusinessRuleViolationException("Username is already taken: " + request.getUsername());
        }
        if (request.getRole() == AppUserRole.SuperAdmin && !actorIsSuperAdmin()) {
            throw new BusinessRuleViolationException("Only a Super Admin can create a Super Admin");
        }
        if (request.getRole() != AppUserRole.SuperAdmin && !TenantContext.hasOrganization()) {
            throw new BusinessRuleViolationException("Select an organization before creating users");
        }
        AppUser entity = new AppUser();
        entity.setOrganizationId(request.getRole() == AppUserRole.SuperAdmin ? null : TenantContext.get());
        entity.setUsername(request.getUsername());
        entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        entity.setRole(request.getRole());
        entity.setCoachId(request.getCoachId());
        entity.setAthleteId(request.getAthleteId());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        return toResponse(repository.save(entity));
    }

    public AppUserResponse update(Integer id, AppUserRequest request) {
        validateReferences(request);
        AppUser entity = load(id);
        if ((request.getRole() == AppUserRole.SuperAdmin || entity.getRole() == AppUserRole.SuperAdmin) && !actorIsSuperAdmin()) {
            throw new BusinessRuleViolationException("Only a Super Admin can manage Super Admin accounts");
        }

        boolean losesAdmin = entity.getRole() == AppUserRole.Admin
                && Boolean.TRUE.equals(entity.getIsActive())
                && (request.getRole() != AppUserRole.Admin || Boolean.FALSE.equals(request.getIsActive()));
        if (losesAdmin && repository.countByRoleAndIsActiveAndOrganizationId(AppUserRole.Admin, true, entity.getOrganizationId()) <= 1) {
            throw new BusinessRuleViolationException("At least one active Admin account must remain");
        }
        if (Boolean.FALSE.equals(request.getIsActive()) && isCurrentUser(entity)) {
            throw new BusinessRuleViolationException("You cannot deactivate your own account");
        }
        if (request.getRole() != entity.getRole() && isCurrentUser(entity)) {
            throw new BusinessRuleViolationException("You cannot change your own role");
        }

        entity.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        entity.setRole(request.getRole());
        entity.setCoachId(request.getCoachId());
        entity.setAthleteId(request.getAthleteId());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        return toResponse(repository.save(entity));
    }

    /** Lets a signed-in user change their own password after proving they know the current one. */
    public void changePassword(String username, ChangePasswordRequest request) {
        AppUser entity = repository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + username));
        if (!passwordEncoder.matches(request.getCurrentPassword(), entity.getPasswordHash())) {
            throw new BusinessRuleViolationException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), entity.getPasswordHash())) {
            throw new BusinessRuleViolationException("New password must be different from the current password");
        }
        entity.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        repository.save(entity);
    }

    public void delete(Integer id) {
        AppUser entity = load(id);
        if (isCurrentUser(entity)) {
            throw new BusinessRuleViolationException("You cannot delete your own account");
        }
        if (entity.getRole() == AppUserRole.Admin && Boolean.TRUE.equals(entity.getIsActive())
                && repository.countByRoleAndIsActiveAndOrganizationId(AppUserRole.Admin, true, entity.getOrganizationId()) <= 1) {
            throw new BusinessRuleViolationException("At least one active Admin account must remain");
        }
        repository.deleteById(id);
    }

    private boolean isCurrentUser(AppUser entity) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && entity.getUsername().equals(auth.getName());
    }

    private void validateReferences(AppUserRequest request) {
        if (request.getCoachId() != null && !coachRepository.existsById(request.getCoachId())) {
            throw new InvalidReferenceException("coachId " + request.getCoachId() + " does not exist");
        }
        if (request.getAthleteId() != null && !athleteRepository.existsById(request.getAthleteId())) {
            throw new InvalidReferenceException("athleteId " + request.getAthleteId() + " does not exist");
        }
        if (request.getRole() == AppUserRole.Athlete && request.getAthleteId() == null) {
            throw new BusinessRuleViolationException("An Athlete account must be linked to an athlete");
        }
        if (request.getRole() == AppUserRole.Coach && request.getCoachId() == null) {
            throw new BusinessRuleViolationException("A Coach account must be linked to a coach");
        }
    }

    private AppUserResponse toResponse(AppUser entity) {
        return new AppUserResponse(
                entity.getUserId(),
                entity.getUsername(),
                entity.getRole(),
                entity.getCoachId(),
                entity.getAthleteId(),
                entity.getOrganizationId(),
                entity.getIsActive(),
                entity.getLastLogin()
        );
    }
}
