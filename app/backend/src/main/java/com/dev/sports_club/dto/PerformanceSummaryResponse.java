package com.dev.sports_club.dto;

import com.dev.sports_club.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceSummaryResponse {

    private Integer athleteId;
    private List<PerformanceResponse> recent;
    private Double averageRating;
    private Double latestRating;
    private int gamesPlayed;
    private int wins;
    private Map<String, Double> statTotals;
}
