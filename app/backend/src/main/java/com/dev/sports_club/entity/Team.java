package com.dev.sports_club.entity;

import com.dev.sports_club.tenant.TenantOwned;
import org.hibernate.annotations.Filter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Filter(name = "tenant")
@Table(name = "team")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Team extends TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "team_id")
    private Integer teamId;

    @Column(name = "team_name", nullable = false, unique = true, length = 100)
    private String teamName;

    @Column(name = "sport_id", nullable = false)
    private Integer sportId;

    @Column(name = "coach_id", nullable = false)
    private Integer coachId;

    @Column(name = "founded_date")
    private LocalDate foundedDate;
}
