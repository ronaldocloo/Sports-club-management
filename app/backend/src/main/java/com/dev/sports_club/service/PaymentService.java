package com.dev.sports_club.service;

import com.dev.sports_club.dto.PaymentRequest;
import com.dev.sports_club.entity.AppUserRole;
import com.dev.sports_club.entity.NotificationKind;
import com.dev.sports_club.repository.AthleteRepository;
import com.dev.sports_club.dto.PaymentResponse;
import com.dev.sports_club.entity.Membership;
import com.dev.sports_club.entity.Payment;
import com.dev.sports_club.entity.PaymentStatus;
import com.dev.sports_club.exception.BusinessRuleViolationException;
import com.dev.sports_club.exception.InvalidReferenceException;
import com.dev.sports_club.repository.MembershipRepository;
import com.dev.sports_club.repository.PaymentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class PaymentService {

    private final PaymentRepository repository;
    private final MembershipRepository membershipRepository;
    private final AthleteRepository athleteRepository;
    private final NotificationService notifications;

    public List<PaymentResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PaymentResponse findById(Integer id) {
        Payment entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));
        return toResponse(entity);
    }

    public PaymentResponse create(PaymentRequest request) {
        validateReferences(request);
        validateBusinessRules(request);
        Payment entity = new Payment();
        applyRequest(entity, request);
        entity.setStatus(request.getStatus() != null ? request.getStatus() : PaymentStatus.Pending);
        Payment saved = repository.save(entity);
        if (saved.getStatus() == PaymentStatus.Completed) {
            announce(saved);
        }
        return toResponse(saved);
    }

    public PaymentResponse update(Integer id, PaymentRequest request) {
        validateReferences(request);
        Payment entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));
        PaymentStatus target = request.getStatus() != null ? request.getStatus() : entity.getStatus();
        enforceLifecycle(entity, request, target);
        boolean becomesCompleted = target == PaymentStatus.Completed && entity.getStatus() != PaymentStatus.Completed;
        if (becomesCompleted) {
            checkNotOverpaid(entity.getMembershipId(), request.getAmount());
        }
        applyRequest(entity, request);
        entity.setStatus(target);
        Payment saved = repository.save(entity);
        if (becomesCompleted) {
            announce(saved);
        }
        return toResponse(saved);
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateReferences(PaymentRequest request) {
        if (!membershipRepository.existsById(request.getMembershipId())) {
            throw new InvalidReferenceException("membershipId " + request.getMembershipId() + " does not exist");
        }
    }

    /** A completed payment is a financial record: it can only be refunded, never edited or reverted. */
    private void enforceLifecycle(Payment entity, PaymentRequest request, PaymentStatus target) {
        if (entity.getStatus() == PaymentStatus.Refunded) {
            throw new BusinessRuleViolationException("A refunded payment cannot be changed");
        }
        if (entity.getStatus() == PaymentStatus.Completed) {
            boolean sameDetails = entity.getMembershipId().equals(request.getMembershipId())
                    && entity.getAmount().compareTo(request.getAmount()) == 0
                    && entity.getPaymentDate().equals(request.getPaymentDate())
                    && entity.getMethod() == request.getMethod()
                    && java.util.Objects.equals(entity.getReferenceNo(), request.getReferenceNo());
            boolean allowed = sameDetails && (target == PaymentStatus.Completed || target == PaymentStatus.Refunded);
            if (!allowed) {
                throw new BusinessRuleViolationException("A completed payment cannot be changed; it can only be refunded");
            }
        }
    }

    private void checkNotOverpaid(Integer membershipId, BigDecimal amount) {
        Membership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new EntityNotFoundException("Membership not found: " + membershipId));
        BigDecimal paidSoFar = repository.sumAmountByMembershipIdAndStatus(membershipId, PaymentStatus.Completed);
        if (paidSoFar.add(amount).compareTo(membership.getAmountCharged()) > 0) {
            throw new BusinessRuleViolationException("Payment would exceed membership amount charged");
        }
    }

    private void announce(Payment p) {
        String who = membershipRepository.findById(p.getMembershipId())
                .flatMap(m -> athleteRepository.findById(m.getAthleteId()))
                .map(a -> a.getFirstName() + " " + a.getLastName()).orElse("a member");
        notifications.notifyRoles(p.getOrganizationId(), java.util.List.of(AppUserRole.Admin, AppUserRole.FrontDesk), NotificationKind.payment,
                "Payment received: GH₵" + p.getAmount().stripTrailingZeros().toPlainString() + " from " + who + ".", "/payments", "payment:" + p.getPaymentId());
    }

    private void validateBusinessRules(PaymentRequest request) {
        if (request.getReferenceNo() != null && repository.existsByReferenceNo(request.getReferenceNo())) {
            throw new BusinessRuleViolationException(
                    "Payment reference number already exists: " + request.getReferenceNo());
        }
        Membership membership = membershipRepository.findById(request.getMembershipId())
                .orElseThrow(() -> new EntityNotFoundException("Membership not found: " + request.getMembershipId()));
        BigDecimal paidSoFar = repository.sumAmountByMembershipIdAndStatus(request.getMembershipId(), PaymentStatus.Completed);
        if (paidSoFar.add(request.getAmount()).compareTo(membership.getAmountCharged()) > 0) {
            throw new BusinessRuleViolationException("Payment would exceed membership amount charged");
        }
    }

    private void applyRequest(Payment entity, PaymentRequest request) {
        entity.setMembershipId(request.getMembershipId());
        entity.setAmount(request.getAmount());
        entity.setPaymentDate(request.getPaymentDate());
        entity.setMethod(request.getMethod());
        entity.setReferenceNo(request.getReferenceNo());
    }

    private PaymentResponse toResponse(Payment entity) {
        return new PaymentResponse(
                entity.getPaymentId(),
                entity.getMembershipId(),
                entity.getAmount(),
                entity.getPaymentDate(),
                entity.getMethod(),
                entity.getStatus(),
                entity.getReferenceNo()
        );
    }
}
