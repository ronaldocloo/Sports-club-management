package com.dev.sports_club.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SportRequest {

    @NotBlank
    @Size(max = 50)
    private String sportName;

    @Size(max = 255)
    private String description;
}
