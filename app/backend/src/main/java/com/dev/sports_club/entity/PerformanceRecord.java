package com.dev.sports_club.entity;

import com.dev.sports_club.tenant.TenantOwned;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Filter(name = "tenant")
@Table(name = "performance_record")
@Getter
@Setter
@NoArgsConstructor
public class PerformanceRecord extends TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Integer recordId;

    @Column(name = "athlete_id", nullable = false)
    private Integer athleteId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "rating", nullable = false, precision = 4, scale = 1)
    private BigDecimal rating;

    /** Sport-specific numbers as a JSON object, for example {"goals":2,"assists":1}. */
    @Column(name = "stats", length = 1000)
    private String stats;

    @Column(name = "notes", length = 255)
    private String notes;
}
