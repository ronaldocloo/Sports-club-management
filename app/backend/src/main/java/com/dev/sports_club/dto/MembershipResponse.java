package com.dev.sports_club.dto;

import com.dev.sports_club.entity.MembershipStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipResponse {

    private Integer membershipId;
    private Integer athleteId;
    private Integer typeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal amountCharged;
    private MembershipStatus status;
}
