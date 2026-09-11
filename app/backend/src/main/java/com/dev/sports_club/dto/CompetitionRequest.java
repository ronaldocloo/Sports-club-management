package com.dev.sports_club.dto;

import com.dev.sports_club.entity.CompetitionLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompetitionRequest {

    @NotBlank
    @Size(max = 100)
    private String compName;

    @NotNull
    private LocalDate compDate;

    @Size(max = 100)
    private String venue;

    @NotNull
    private CompetitionLevel level;

    private LocalDate registrationDeadline;
}
