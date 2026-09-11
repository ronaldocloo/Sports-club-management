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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
