package com.dev.sports_club.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamRosterResponse {

    private Integer teamId;
    private Integer athleteId;
    private LocalDate dateJoined;
    private String position;
    private Boolean isActive;
}
