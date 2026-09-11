package com.dev.sports_club.controller;

import com.dev.sports_club.dto.TeamRosterRequest;
import com.dev.sports_club.dto.TeamRosterResponse;
import com.dev.sports_club.service.TeamRosterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team-rosters")
@RequiredArgsConstructor
public class TeamRosterController {

    private final TeamRosterService service;

    @GetMapping
    public List<TeamRosterResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{teamId}/{athleteId}")
    public TeamRosterResponse findById(@PathVariable Integer teamId, @PathVariable Integer athleteId) {
        return service.findById(teamId, athleteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamRosterResponse create(@Valid @RequestBody TeamRosterRequest request) {
        return service.create(request);
    }

    @PutMapping("/{teamId}/{athleteId}")
    public TeamRosterResponse update(
            @PathVariable Integer teamId, @PathVariable Integer athleteId, @Valid @RequestBody TeamRosterRequest request) {
        return service.update(teamId, athleteId, request);
    }

    @DeleteMapping("/{teamId}/{athleteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer teamId, @PathVariable Integer athleteId) {
        service.delete(teamId, athleteId);
    }
}
