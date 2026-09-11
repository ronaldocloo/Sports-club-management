package com.dev.sports_club.controller;

import com.dev.sports_club.dto.MembershipRequest;
import com.dev.sports_club.dto.MembershipResponse;
import com.dev.sports_club.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService service;

    @GetMapping
    public List<MembershipResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public MembershipResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MembershipResponse create(@Valid @RequestBody MembershipRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public MembershipResponse update(@PathVariable Integer id, @Valid @RequestBody MembershipRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
