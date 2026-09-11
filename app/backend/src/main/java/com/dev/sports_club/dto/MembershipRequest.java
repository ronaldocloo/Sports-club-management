package com.dev.sports_club.dto;

import com.dev.sports_club.entity.MembershipStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class MembershipRequest {

    @NotNull
    private Integer athleteId;

    @NotNull
    private Integer typeId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal amountCharged;

    private MembershipStatus status;

    @AssertTrue(message = "endDate must be after startDate")
    @JsonIgnore
    public boolean isEndAfterStart() {
        return startDate == null || endDate == null || endDate.isAfter(startDate);
    }
}
