package com.dev.sports_club.controller;

import com.dev.sports_club.dto.AppUserRequest;
import com.dev.sports_club.dto.AppUserResponse;
import com.dev.sports_club.service.AppUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService service;

    @GetMapping
    public List<AppUserResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public AppUserResponse findById(@PathVariable Integer id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppUserResponse create(@Valid @RequestBody AppUserRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AppUserResponse update(@PathVariable Integer id, @Valid @RequestBody AppUserRequest request) {
        return service.update(id, request);
    }

    /** For someone who lost their phone: switches their two-step sign-in off so they can enrol again. */
    @PostMapping("/{id}/mfa/reset")
    public AppUserResponse resetMfa(@PathVariable Integer id) {
        return service.resetMfa(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
