package com.dev.sports_club.service;

import com.dev.sports_club.dto.OrganizationRequest;
import com.dev.sports_club.dto.OrganizationResponse;
import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.entity.AppUserRole;
import com.dev.sports_club.entity.Organization;
import com.dev.sports_club.entity.OrganizationPlan;
import com.dev.sports_club.entity.OrganizationStatus;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.repository.AppUserRepository;
import com.dev.sports_club.repository.OrganizationRepository;
import com.dev.sports_club.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class OrganizationService {

    private final OrganizationRepository repository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<OrganizationResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrganizationResponse current() {
        return toResponse(load(requireContextOrganization()));
    }

    /** Creates an organization together with its first Admin account, in one transaction. */
    public OrganizationResponse create(OrganizationRequest request) {
        if (request.getAdminUsername() == null || request.getAdminUsername().isBlank()
                || request.getAdminPassword() == null) {
            throw new BusinessRuleViolationException("An admin username and password (8+ characters) are required");
        }
        if (repository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new BusinessRuleViolationException("An organization with this name already exists");
        }
        if (userRepository.findByUsername(request.getAdminUsername()).isPresent()) {
            throw new BusinessRuleViolationException("Username is already taken: " + request.getAdminUsername());
        }
        Organization org = new Organization();
        org.setName(request.getName().trim());
        org.setSlug(uniqueSlug(request.getName()));
        org.setPlan(request.getPlan() != null ? request.getPlan() : OrganizationPlan.Starter);
        org.setStatus(request.getStatus() != null ? request.getStatus() : OrganizationStatus.Trial);
        org = repository.save(org);

        AppUser admin = new AppUser();
        admin.setUsername(request.getAdminUsername());
        admin.setPasswordHash(passwordEncoder.encode(request.getAdminPassword()));
        admin.setRole(AppUserRole.Admin);
        admin.setOrganizationId(org.getOrganizationId());
        admin.setIsActive(Boolean.TRUE);
        userRepository.save(admin);
        return toResponse(org);
    }

    /** Super Admin: name, plan and status of any organization. */
    public OrganizationResponse update(Integer id, OrganizationRequest request) {
        Organization org = load(id);
        String name = request.getName().trim();
        if (!name.equalsIgnoreCase(org.getName()) && repository.existsByNameIgnoreCase(name)) {
            throw new BusinessRuleViolationException("An organization with this name already exists");
        }
        org.setName(name);
        if (request.getPlan() != null) org.setPlan(request.getPlan());
        if (request.getStatus() != null) org.setStatus(request.getStatus());
        return toResponse(repository.save(org));
    }

    /** An organization Admin may only rename their own organization. */
    public OrganizationResponse renameCurrent(OrganizationRequest request) {
        Organization org = load(requireContextOrganization());
        String name = request.getName().trim();
        if (!name.equalsIgnoreCase(org.getName()) && repository.existsByNameIgnoreCase(name)) {
            throw new BusinessRuleViolationException("An organization with this name already exists");
        }
        org.setName(name);
        return toResponse(repository.save(org));
    }

    private Integer requireContextOrganization() {
        if (!TenantContext.hasOrganization()) {
            throw new BusinessRuleViolationException("No organization selected");
        }
        return TenantContext.get();
    }

    private Organization load(Integer id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Organization not found: " + id));
    }

    private String uniqueSlug(String name) {
        String base = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (base.isBlank()) base = "organization";
        String slug = base;
        int n = 2;
        while (repository.existsBySlug(slug)) {
            slug = base + "-" + n++;
        }
        return slug;
    }

    private OrganizationResponse toResponse(Organization o) {
        return new OrganizationResponse(o.getOrganizationId(), o.getName(), o.getSlug(), o.getPlan(), o.getStatus(),
                o.getCreatedAt(), repository.countAthletes(o.getOrganizationId()), repository.countUsers(o.getOrganizationId()));
    }
}
