package com.dev.sports_club.controller;

import com.dev.sports_club.dto.CompetitionRequest;
import com.dev.sports_club.dto.CompetitionResponse;
import com.dev.sports_club.service.CompetitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService service;

    @GetMapping
    public List<CompetitionResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public CompetitionResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompetitionResponse create(@Valid @RequestBody CompetitionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public CompetitionResponse update(@PathVariable Integer id, @Valid @RequestBody CompetitionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
