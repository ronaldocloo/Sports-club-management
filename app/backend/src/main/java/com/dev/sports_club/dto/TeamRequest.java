package com.dev.sports_club.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TeamRequest {

    @NotBlank
    @Size(max = 100)
    private String teamName;

    @NotNull
    private Integer sportId;

    @NotNull
    private Integer coachId;

    private LocalDate foundedDate;
}
