package com.dev.sports_club.repository;

import com.dev.sports_club.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("select a from AuditLog a where (:org is null or a.organizationId = :org) "
            + "and (:type is null or a.entityType = :type) "
            + "and (:q is null or lower(a.description) like lower(concat('%', :q, '%'))) "
            + "order by a.createdAt desc, a.auditId desc")
    List<AuditLog> search(@Param("org") Integer org, @Param("type") String type, @Param("q") String q,
                          org.springframework.data.domain.Pageable pageable);
}
