package com.dev.sports_club.dto;

import com.dev.sports_club.entity.FacilityStatus;
import com.dev.sports_club.entity.FacilityType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityResponse {

    private Integer facilityId;
    private String facilityName;
    private FacilityType facilityType;
    private Integer capacity;
    private String location;
    private FacilityStatus status;
}
