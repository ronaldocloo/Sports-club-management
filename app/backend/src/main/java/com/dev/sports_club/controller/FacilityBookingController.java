package com.dev.sports_club.controller;

import com.dev.sports_club.dto.FacilityBookingRequest;
import com.dev.sports_club.dto.FacilityBookingResponse;
import com.dev.sports_club.service.FacilityBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facility-bookings")
@RequiredArgsConstructor
public class FacilityBookingController {

    private final FacilityBookingService service;

    @GetMapping
    public List<FacilityBookingResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public FacilityBookingResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FacilityBookingResponse create(@Valid @RequestBody FacilityBookingRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public FacilityBookingResponse update(@PathVariable Integer id, @Valid @RequestBody FacilityBookingRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
