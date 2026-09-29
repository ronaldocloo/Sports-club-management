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
public class EventRequest {

    @NotBlank @Size(max = 150) private String title;
    @NotNull private EventType eventType;
    @NotNull private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    @Size(max = 100) private String location;
    @Size(max = 100) private String organizer;
    @Size(max = 500) private String description;
    private EventStatus status;
}
