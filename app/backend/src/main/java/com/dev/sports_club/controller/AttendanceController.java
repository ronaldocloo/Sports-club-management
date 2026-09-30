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
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService service;

    @GetMapping("/athletes")
    public List<AttendanceSummaryResponse> forVisibleAthletes() {
        return service.summaryForVisibleAthletes();
    }

    @GetMapping("/athletes/{athleteId}")
    public AttendanceSummaryResponse forAthlete(@PathVariable Integer athleteId) {
        return service.summaryForAthlete(athleteId);
    }
}
