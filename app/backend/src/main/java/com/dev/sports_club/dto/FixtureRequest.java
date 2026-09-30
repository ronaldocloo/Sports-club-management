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
public class FixtureRequest {

    @NotNull private Integer competitionId;
    @NotNull private Integer homeTeamId;
    @NotNull private Integer awayTeamId;
    @Size(max = 50) private String roundLabel;
    @Size(max = 100) private String venue;
    @NotNull private LocalDate matchDate;
    private LocalTime matchTime;
    @Size(max = 100) private String officials;
    private FixtureStatus status;
}
