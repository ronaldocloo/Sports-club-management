package com.dev.sports_club.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipTypeResponse {

    private Integer typeId;
    private String typeName;
    private BigDecimal fee;
    private Integer durationMonths;
    private String description;
}
