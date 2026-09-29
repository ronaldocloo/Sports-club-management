package com.dev.sports_club.dto;

import com.dev.sports_club.entity.OrganizationPlan;
import com.dev.sports_club.entity.OrganizationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResponse {

    private Integer organizationId;
    private String name;
    private String slug;
    private OrganizationPlan plan;
    private OrganizationStatus status;
    private LocalDateTime createdAt;
    private Long athleteCount;
    private Long userCount;
}
