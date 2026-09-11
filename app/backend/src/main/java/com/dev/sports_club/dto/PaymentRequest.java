package com.dev.sports_club.dto;

import com.dev.sports_club.entity.PaymentMethod;
import com.dev.sports_club.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentRequest {

    @NotNull
    private Integer membershipId;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private LocalDateTime paymentDate;

    @NotNull
    private PaymentMethod method;

    private PaymentStatus status;

    @Size(max = 50)
    private String referenceNo;
}
