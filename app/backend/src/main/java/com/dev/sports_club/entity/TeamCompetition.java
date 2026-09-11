package com.dev.sports_club.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "team_competition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeamCompetition {

    @EmbeddedId
    private TeamCompetitionId id;

    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @Column(name = "final_position")
    private Integer finalPosition;

    @Column(name = "points_scored")
    private Integer pointsScored;
}
