package com.dev.sports_club.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {

    private Integer teamId;
    private String teamName;
    private Integer sportId;
    private Integer coachId;
    private LocalDate foundedDate;
}
