package com.dev.sports_club.controller;

import com.dev.sports_club.dto.TeamRequest;
import com.dev.sports_club.dto.TeamResponse;
import com.dev.sports_club.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService service;

    @GetMapping
    public List<TeamResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TeamResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamResponse create(@Valid @RequestBody TeamRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public TeamResponse update(@PathVariable Integer id, @Valid @RequestBody TeamRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
