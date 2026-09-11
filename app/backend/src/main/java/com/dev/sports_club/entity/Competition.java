package com.dev.sports_club.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "competition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "competition_id")
    private Integer competitionId;

    @Column(name = "comp_name", nullable = false, length = 100)
    private String compName;

    @Column(name = "comp_date", nullable = false)
    private LocalDate compDate;

    @Column(name = "venue", length = 100)
    private String venue;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private CompetitionLevel level;

    @Column(name = "registration_deadline")
    private LocalDate registrationDeadline;
}
