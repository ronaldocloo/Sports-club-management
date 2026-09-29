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
@Table(name = "attendance")
@Getter
@Setter
@NoArgsConstructor
public class Attendance extends TenantOwned {

    @EmbeddedId
    private AttendanceId id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AttendanceStatus status;
}
