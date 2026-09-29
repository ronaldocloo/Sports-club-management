package com.dev.sports_club.controller;

import com.dev.sports_club.service.AccessScope;
import com.dev.sports_club.dto.TeamCompetitionRequest;
import com.dev.sports_club.dto.TeamCompetitionResponse;
import com.dev.sports_club.service.TeamCompetitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team-competitions")
@RequiredArgsConstructor
public class TeamCompetitionController {

    private final TeamCompetitionService service;
    private final AccessScope scope;

    @GetMapping
    public List<TeamCompetitionResponse> findAll() {
        var visible = scope.current();
        return service.findAll().stream().filter(tc -> visible.team(tc.getTeamId())).toList();
    }

    @GetMapping("/{teamId}/{competitionId}")
    public TeamCompetitionResponse findById(@PathVariable Integer teamId, @PathVariable Integer competitionId) {
        scope.current().requireTeam(teamId);
        return service.findById(teamId, competitionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamCompetitionResponse create(@Valid @RequestBody TeamCompetitionRequest request) {
        return service.create(request);
    }

    @PutMapping("/{teamId}/{competitionId}")
    public TeamCompetitionResponse update(
            @PathVariable Integer teamId, @PathVariable Integer competitionId, @Valid @RequestBody TeamCompetitionRequest request) {
        return service.update(teamId, competitionId, request);
    }

    @DeleteMapping("/{teamId}/{competitionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer teamId, @PathVariable Integer competitionId) {
        service.delete(teamId, competitionId);
    }
}
