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
public class PerformanceRequest {

    @NotNull private Integer athleteId;
    @NotNull private LocalDate recordDate;
    @NotNull @DecimalMin("0.0") @DecimalMax("100.0") private BigDecimal rating;
    private Map<String, Double> stats;
    @Size(max = 255) private String notes;
}
