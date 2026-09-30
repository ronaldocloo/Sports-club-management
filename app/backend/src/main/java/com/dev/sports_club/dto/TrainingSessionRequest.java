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
public class TrainingSessionRequest {

    @NotNull private Integer teamId;
    @NotNull private LocalDate sessionDate;
    @NotNull private LocalTime startTime;
    @Size(max = 100) private String location;
    @Size(max = 255) private String notes;
}
