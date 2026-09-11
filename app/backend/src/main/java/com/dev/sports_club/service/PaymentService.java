package com.dev.sports_club.service;

import com.dev.sports_club.dto.PaymentRequest;
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
public class PaymentService {

    private final PaymentRepository repository;
    private final MembershipRepository membershipRepository;

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
        return toResponse(repository.save(entity));
    }

    public PaymentResponse update(Integer id, PaymentRequest request) {
        validateReferences(request);
        Payment entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id));
        applyRequest(entity, request);
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }
        return toResponse(repository.save(entity));
    }

    public void delete(Integer id) {
        repository.deleteById(id);
    }

    private void validateReferences(PaymentRequest request) {
        if (!membershipRepository.existsById(request.getMembershipId())) {
            throw new InvalidReferenceException("membershipId " + request.getMembershipId() + " does not exist");
        }
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
