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
public class TrainingSessionResponse {

    private Integer sessionId;
    private Integer teamId;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private String location;
    private String notes;
    private List<AttendanceEntry> attendance;
}
