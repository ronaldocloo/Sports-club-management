package com.dev.sports_club.controller;

import com.dev.sports_club.dto.MembershipTypeRequest;
import com.dev.sports_club.dto.MembershipTypeResponse;
import com.dev.sports_club.service.MembershipTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membership-types")
@RequiredArgsConstructor
public class MembershipTypeController {

    private final MembershipTypeService service;

    @GetMapping
    public List<MembershipTypeResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public MembershipTypeResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MembershipTypeResponse create(@Valid @RequestBody MembershipTypeRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public MembershipTypeResponse update(@PathVariable Integer id, @Valid @RequestBody MembershipTypeRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
