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
public class AttendanceSummaryResponse {

    private Integer athleteId;
    private int total;
    private int present;
    private int late;
    private int absent;
    private int excused;
    private Integer rate;
    private Integer recentRate;
    private Integer earlierRate;
    private List<SessionMark> sessions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionMark {
        private LocalDate date;
        private AttendanceStatus status;
        private Integer teamId;
    }
}
