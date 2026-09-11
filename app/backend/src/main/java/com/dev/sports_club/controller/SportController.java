package com.dev.sports_club.controller;

import com.dev.sports_club.dto.SportRequest;
import com.dev.sports_club.dto.SportResponse;
import com.dev.sports_club.service.SportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sports")
@RequiredArgsConstructor
public class SportController {

    private final SportService service;

    @GetMapping
    public List<SportResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SportResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SportResponse create(@Valid @RequestBody SportRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SportResponse update(@PathVariable Integer id, @Valid @RequestBody SportRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
