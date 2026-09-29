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
public class FixtureResponse {

    private Integer fixtureId;
    private Integer competitionId;
    private Integer homeTeamId;
    private Integer awayTeamId;
    private String roundLabel;
    private String venue;
    private LocalDate matchDate;
    private LocalTime matchTime;
    private String officials;
    private FixtureStatus status;
    private Integer homeScore;
    private Integer awayScore;
}
