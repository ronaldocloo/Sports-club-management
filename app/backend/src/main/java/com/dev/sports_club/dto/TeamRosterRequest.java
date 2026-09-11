package com.dev.sports_club.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TeamRosterRequest {

    @NotNull
    private Integer teamId;

    @NotNull
    private Integer athleteId;

    private LocalDate dateJoined;

    @Size(max = 50)
    private String position;

    private Boolean isActive;
}
