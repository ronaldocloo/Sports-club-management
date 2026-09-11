package com.dev.sports_club.repository;

import com.dev.sports_club.entity.FacilityBooking;
import com.dev.sports_club.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface FacilityBookingRepository extends JpaRepository<FacilityBooking, Integer> {

    boolean existsByFacilityIdAndBookingDateAndTimeSlot(Integer facilityId, LocalDate bookingDate, TimeSlot timeSlot);

    boolean existsByFacilityIdAndBookingDateAndTimeSlotAndBookingIdNot(
            Integer facilityId, LocalDate bookingDate, TimeSlot timeSlot, Integer bookingId);
}
