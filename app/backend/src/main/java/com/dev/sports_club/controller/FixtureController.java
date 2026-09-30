package com.dev.sports_club.controller;

import com.dev.sports_club.dto.*;
import com.dev.sports_club.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fixtures")
@RequiredArgsConstructor
public class FixtureController {

    private final FixtureService service;

    @GetMapping
    public List<FixtureResponse> findAll(@RequestParam(required = false) Integer competitionId) {
        return service.findAll(competitionId);
    }

    @GetMapping("/standings")
    public List<StandingResponse> standings(@RequestParam Integer competitionId) {
        return service.standings(competitionId);
    }

    @GetMapping("/{id}")
    public FixtureResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FixtureResponse create(@Valid @RequestBody FixtureRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public FixtureResponse update(@PathVariable Integer id, @Valid @RequestBody FixtureRequest request) {
        return service.update(id, request);
    }

    @PutMapping("/{id}/result")
    public FixtureResponse recordResult(@PathVariable Integer id, @Valid @RequestBody FixtureResultRequest request) {
        return service.recordResult(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
