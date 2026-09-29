package com.dev.sports_club.controller;

import com.dev.sports_club.dto.IntelligenceResponses.*;
import com.dev.sports_club.service.IntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/intelligence")
@RequiredArgsConstructor
public class IntelligenceController {

    private final IntelligenceService service;

    @GetMapping("/retention")
    public RetentionOverview retention() { return service.retention(LocalDate.now()); }

    @PostMapping("/retention/{athleteId}/nudge")
    public Map<String, Object> nudge(@PathVariable Integer athleteId) { return Map.of("notified", service.nudge(athleteId)); }

    @GetMapping("/revenue-forecast")
    public RevenueForecast revenueForecast() { return service.revenueForecast(LocalDate.now()); }

    @GetMapping("/attendance-outlook")
    public List<TeamOutlook> attendanceOutlook() { return service.attendanceOutlook(LocalDate.now()); }

    @GetMapping("/facility-demand")
    public FacilityDemand facilityDemand() { return service.facilityDemand(LocalDate.now()); }

    @GetMapping("/anomalies")
    public List<Anomaly> anomalies() { return service.anomalies(LocalDate.now()); }

    @GetMapping("/athletes/{athleteId}")
    public AthleteInsight athleteInsight(@PathVariable Integer athleteId) { return service.athleteInsight(athleteId, LocalDate.now()); }
}
