package com.dev.sports_club.entity;

import com.dev.sports_club.tenant.TenantOwned;
import org.hibernate.annotations.Filter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Filter(name = "tenant")
@Table(name = "sport")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sport extends TenantOwned {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sport_id")
    private Integer sportId;

    @Column(name = "sport_name", nullable = false, unique = true, length = 50)
    private String sportName;

    @Column(name = "description", length = 255)
    private String description;
}
