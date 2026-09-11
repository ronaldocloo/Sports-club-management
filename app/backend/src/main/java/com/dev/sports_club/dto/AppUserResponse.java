package com.dev.sports_club.dto;

import com.dev.sports_club.entity.AppUserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppUserResponse {

    private Integer userId;
    private String username;
    private AppUserRole role;
    private Integer coachId;
    private Boolean isActive;
    private LocalDateTime lastLogin;
}
