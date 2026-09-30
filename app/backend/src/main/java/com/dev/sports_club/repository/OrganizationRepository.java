package com.dev.sports_club.repository;

import com.dev.sports_club.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Integer> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    // Native queries are not affected by the tenant filter, so a Super Admin can count across organizations.
    @Query(value = "select count(*) from athlete where organization_id = :id", nativeQuery = true)
    long countAthletes(@Param("id") Integer id);

    @Query(value = "select count(*) from app_user where organization_id = :id", nativeQuery = true)
    long countUsers(@Param("id") Integer id);
}
