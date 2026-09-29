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
@RequestMapping("/api/training-sessions")
@RequiredArgsConstructor
public class TrainingSessionController {

    private final AttendanceService service;

    @GetMapping
    public List<TrainingSessionResponse> list(@RequestParam(required = false) Integer teamId) {
        return service.listSessions(teamId);
    }

    @GetMapping("/{id}")
    public TrainingSessionResponse get(@PathVariable Integer id) {
        return service.getSession(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingSessionResponse create(@Valid @RequestBody TrainingSessionRequest request) {
        return service.createSession(request);
    }

    @PutMapping("/{id}/attendance")
    public TrainingSessionResponse recordAttendance(@PathVariable Integer id, @Valid @RequestBody AttendanceUpdateRequest request) {
        return service.recordAttendance(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.deleteSession(id);
    }
}
