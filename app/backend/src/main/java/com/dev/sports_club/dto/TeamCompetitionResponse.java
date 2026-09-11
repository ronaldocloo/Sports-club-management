package com.dev.sports_club.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamCompetitionResponse {

    private Integer teamId;
    private Integer competitionId;
    private LocalDate registrationDate;
    private Integer finalPosition;
    private Integer pointsScored;
}
