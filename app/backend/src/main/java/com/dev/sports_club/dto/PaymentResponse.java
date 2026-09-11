package com.dev.sports_club.dto;

import com.dev.sports_club.entity.PaymentMethod;
import com.dev.sports_club.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Integer paymentId;
    private Integer membershipId;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private PaymentMethod method;
    private PaymentStatus status;
    private String referenceNo;
}
