package com.dev.sports_club.repository;

import com.dev.sports_club.entity.Membership;
import com.dev.sports_club.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Integer> {

    boolean existsByAthleteIdAndStatus(Integer athleteId, MembershipStatus status);

    boolean existsByAthleteIdAndStatusAndMembershipIdNot(Integer athleteId, MembershipStatus status, Integer membershipId);

    @Query("SELECT COUNT(m) > 0 FROM Membership m WHERE m.athleteId = :athleteId AND m.status = :status "
            + "AND CURRENT_DATE BETWEEN m.startDate AND m.endDate")
    boolean hasCurrentActiveMembership(@Param("athleteId") Integer athleteId, @Param("status") MembershipStatus status);
}
