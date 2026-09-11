package com.dev.sports_club.dto;

import com.dev.sports_club.entity.BookingStatus;
import com.dev.sports_club.entity.TimeSlot;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FacilityBookingRequest {

    @NotNull
    private Integer facilityId;

    @NotNull
    private Integer teamId;

    @NotNull
    private LocalDate bookingDate;

    @NotNull
    private TimeSlot timeSlot;

    @Size(max = 100)
    private String purpose;

    private BookingStatus status;
}
