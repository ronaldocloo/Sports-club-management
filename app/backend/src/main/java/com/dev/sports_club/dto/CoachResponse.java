package com.dev.sports_club.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoachResponse {

    private Integer coachId;
    private String firstName;
    private String lastName;
    private String specialty;
    private String email;
    private String phone;
    private LocalDate hireDate;
}
