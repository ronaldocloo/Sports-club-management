package com.dev.sports_club.dto;

import com.dev.sports_club.entity.OrganizationPlan;
import com.dev.sports_club.entity.OrganizationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OrganizationRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    private OrganizationPlan plan;

    private OrganizationStatus status;

    // Only used when creating an organization: the first Admin account for it.
    @Size(max = 50)
    private String adminUsername;

    @Size(min = 8, max = 100)
    private String adminPassword;
}
