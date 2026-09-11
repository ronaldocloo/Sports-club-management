package com.dev.sports_club.dto;

import com.dev.sports_club.entity.BookingStatus;
import com.dev.sports_club.entity.TimeSlot;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacilityBookingResponse {

    private Integer bookingId;
    private Integer facilityId;
    private Integer teamId;
    private LocalDate bookingDate;
    private TimeSlot timeSlot;
    private String purpose;
    private BookingStatus status;
    private LocalDateTime createdAt;
}
