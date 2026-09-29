package com.dev.sports_club.repository;

import com.dev.sports_club.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceRecordRepository extends JpaRepository<PerformanceRecord, Integer> {

    List<PerformanceRecord> findByAthleteIdOrderByRecordDateAsc(Integer athleteId);

    List<PerformanceRecord> findAllByOrderByRecordDateDesc();
}
