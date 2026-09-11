package com.dev.sports_club.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MembershipTypeRequest {

    @NotBlank
    @Size(max = 50)
    private String typeName;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal fee;

    @NotNull
    @Min(1)
    private Integer durationMonths;

    @Size(max = 255)
    private String description;
}
