package com.dev.sports_club.controller;

import com.dev.sports_club.dto.AthleteRequest;
import com.dev.sports_club.dto.AthleteResponse;
import com.dev.sports_club.service.AthleteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/athletes")
@RequiredArgsConstructor
public class AthleteController {

    private final AthleteService service;

    @GetMapping
    public List<AthleteResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public AthleteResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AthleteResponse create(@Valid @RequestBody AthleteRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AthleteResponse update(@PathVariable Integer id, @Valid @RequestBody AthleteRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
