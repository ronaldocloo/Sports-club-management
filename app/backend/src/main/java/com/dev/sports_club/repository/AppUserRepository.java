package com.dev.sports_club.repository;

import com.dev.sports_club.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByUsername(String username);

    java.util.List<AppUser> findByEmailIgnoreCase(String email);

    java.util.List<AppUser> findByOrganizationIdAndRoleInAndIsActiveTrue(Integer organizationId, java.util.Collection<com.dev.sports_club.entity.AppUserRole> roles);

    java.util.List<AppUser> findByCoachIdAndIsActiveTrue(Integer coachId);

    java.util.List<AppUser> findByAthleteIdAndIsActiveTrue(Integer athleteId);

    long countByRoleAndIsActiveAndOrganizationId(com.dev.sports_club.entity.AppUserRole role, Boolean isActive, Integer organizationId);
}
