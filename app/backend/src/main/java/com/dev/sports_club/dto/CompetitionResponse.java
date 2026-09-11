package com.dev.sports_club.dto;

import com.dev.sports_club.entity.CompetitionLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionResponse {

    private Integer competitionId;
    private String compName;
    private LocalDate compDate;
    private String venue;
    private CompetitionLevel level;
    private LocalDate registrationDeadline;
}
