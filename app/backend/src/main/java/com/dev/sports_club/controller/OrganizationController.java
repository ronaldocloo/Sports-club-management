package com.dev.sports_club.controller;

import com.dev.sports_club.dto.OrganizationRequest;
import com.dev.sports_club.dto.OrganizationResponse;
import com.dev.sports_club.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService service;

    // ----- platform level (Super Admin) -----

    @GetMapping("/api/organizations")
    public List<OrganizationResponse> findAll() {
        return service.findAll();
    }

    @PostMapping("/api/organizations")
    @ResponseStatus(HttpStatus.CREATED)
    public OrganizationResponse create(@Valid @RequestBody OrganizationRequest request) {
        return service.create(request);
    }

    @PutMapping("/api/organizations/{id}")
    public OrganizationResponse update(@PathVariable Integer id, @Valid @RequestBody OrganizationRequest request) {
        return service.update(id, request);
    }

    // ----- the caller's own organization -----

    @GetMapping("/api/organization")
    public OrganizationResponse current() {
        return service.current();
    }

    @PutMapping("/api/organization")
    public OrganizationResponse renameCurrent(@Valid @RequestBody OrganizationRequest request) {
        return service.renameCurrent(request);
    }
}
