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
@Table(name = "training_session")
@Getter
@Setter
@NoArgsConstructor
public class TrainingSession extends TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Integer sessionId;

    @Column(name = "team_id", nullable = false)
    private Integer teamId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "notes", length = 255)
    private String notes;
}
