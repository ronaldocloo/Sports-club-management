package com.dev.sports_club.repository;

import com.dev.sports_club.entity.Payment;
import com.dev.sports_club.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    boolean existsByReferenceNo(String referenceNo);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.membershipId = :membershipId AND p.status = :status")
    BigDecimal sumAmountByMembershipIdAndStatus(@Param("membershipId") Integer membershipId, @Param("status") PaymentStatus status);
}
