package com.dev.sports_club.controller;

import com.dev.sports_club.service.AccessScope;
import com.dev.sports_club.dto.PaymentRequest;
import com.dev.sports_club.dto.PaymentResponse;
import com.dev.sports_club.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService service;
    private final AccessScope scope;

    @GetMapping
    public List<PaymentResponse> findAll() {
        var visible = scope.current();
        return service.findAll().stream().filter(p -> visible.membership(p.getMembershipId())).toList();
    }

    @GetMapping("/{id}")
    public PaymentResponse findById(@PathVariable Integer id) {
        var payment = service.findById(id);
        scope.current().requireMembership(payment.getMembershipId());
        return payment;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@Valid @RequestBody PaymentRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public PaymentResponse update(@PathVariable Integer id, @Valid @RequestBody PaymentRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
