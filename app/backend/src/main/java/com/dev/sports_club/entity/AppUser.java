package com.dev.sports_club.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private AppUserRole role;

    @Column(name = "coach_id")
    private Integer coachId;

    @Column(name = "organization_id")
    private Integer organizationId;

    @Column(name = "athlete_id")
    private Integer athleteId;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "failed_attempts", nullable = false)
    private Integer failedAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "mfa_secret", length = 64)
    private String mfaSecret;

    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled = false;

    @Column(name = "mfa_last_step")
    private Long mfaLastStep;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;
}
