package com.dev.sports_club.dto;

import com.dev.sports_club.entity.AppUserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AppUserRequest {

    @NotBlank
    @Size(max = 50)
    private String username;

    // Required when creating a user; optional on update (omit to keep the current password).
    @Size(min = 8, max = 100)
    private String password;

    @NotNull
    private AppUserRole role;

    private Integer coachId;

    private Integer athleteId;

    private Boolean isActive;

    // Optional. Omit to leave unchanged; send an empty string to remove it.
    @jakarta.validation.constraints.Email
    @Size(max = 100)
    private String email;
}
