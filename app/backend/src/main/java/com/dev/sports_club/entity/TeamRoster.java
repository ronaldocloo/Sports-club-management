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
@Table(name = "team_roster")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeamRoster extends TenantOwned {

    @EmbeddedId
    private TeamRosterId id;

    @Column(name = "date_joined", nullable = false)
    private LocalDate dateJoined;

    @Column(name = "position", length = 50)
    private String position;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
