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
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService service;

    @GetMapping
    public List<PerformanceResponse> list(@RequestParam(required = false) Integer athleteId) {
        return service.list(athleteId);
    }

    @GetMapping("/athletes/{athleteId}/summary")
    public PerformanceSummaryResponse summary(@PathVariable Integer athleteId) {
        return service.summary(athleteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PerformanceResponse create(@Valid @RequestBody PerformanceRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PerformanceResponse update(@PathVariable Integer id, @Valid @RequestBody PerformanceRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
