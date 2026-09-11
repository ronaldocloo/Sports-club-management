package com.dev.sports_club.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TeamCompetitionRequest {

    @NotNull
    private Integer teamId;

    @NotNull
    private Integer competitionId;

    private LocalDate registrationDate;

    @Positive
    private Integer finalPosition;

    @PositiveOrZero
    private Integer pointsScored;
}
