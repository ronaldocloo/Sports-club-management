package com.dev.sports_club.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TeamCompetitionId implements Serializable {

    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "competition_id")
    private Integer competitionId;
}
