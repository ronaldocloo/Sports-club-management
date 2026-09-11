package com.dev.sports_club.dto;

import com.dev.sports_club.entity.FacilityStatus;
import com.dev.sports_club.entity.FacilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FacilityRequest {

    @NotBlank
    @Size(max = 100)
    private String facilityName;

    @NotNull
    private FacilityType facilityType;

    @NotNull
    @Positive
    private Integer capacity;

    @Size(max = 100)
    private String location;

    private FacilityStatus status;
}
