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
@Table(name = "fixture")
@Getter
@Setter
@NoArgsConstructor
public class Fixture extends TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fixture_id")
    private Integer fixtureId;

    @Column(name = "competition_id", nullable = false)
    private Integer competitionId;

    @Column(name = "home_team_id", nullable = false)
    private Integer homeTeamId;

    @Column(name = "away_team_id", nullable = false)
    private Integer awayTeamId;

    @Column(name = "round_label", nullable = false, length = 50)
    private String roundLabel;

    @Column(name = "venue", length = 100)
    private String venue;

    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    @Column(name = "match_time")
    private LocalTime matchTime;

    @Column(name = "officials", length = 100)
    private String officials;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FixtureStatus status;

    @Column(name = "home_score")
    private Integer homeScore;

    @Column(name = "away_score")
    private Integer awayScore;
}
