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
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
public class JobController {

    private final DailyJobService jobs;

    /** Runs the daily business-rule job now, for the caller's own organization. */
    @PostMapping("/run")
    public DailyJobService.Result run() {
        return jobs.run();
    }
}
