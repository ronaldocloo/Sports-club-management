package com.dev.sports_club.controller;

import com.dev.sports_club.dto.AppUserResponse;
import com.dev.sports_club.dto.ChangePasswordRequest;
import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.service.AppUserService;
import com.dev.sports_club.service.AuditService;
import com.dev.sports_club.dto.LoginRequest;
import com.dev.sports_club.entity.AppUser;
import com.dev.sports_club.repository.AppUserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final AppUserRepository appUserRepository;
    private final AppUserService appUserService;
    private final AuditService audit;

    @PostMapping("/login")
    public AppUserResponse login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            audit.recordFor(request.getUsername(), AuditAction.LOGIN_FAILED, "Failed sign-in for " + request.getUsername());
            throw e;
        }

        // Issue a fresh session id on login so a pre-login session id can never be reused (session fixation).
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + request.getUsername()));
        user.setLastLogin(LocalDateTime.now());
        appUserRepository.save(user);
        audit.recordFor(user.getUsername(), AuditAction.LOGIN, user.getUsername() + " signed in");

        return toResponse(user);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpRequest) {
        var current = SecurityContextHolder.getContext().getAuthentication();
        if (current != null && current.isAuthenticated()) {
            audit.recordFor(current.getName(), AuditAction.LOGOUT, current.getName() + " signed out");
        }
        SecurityContextHolder.clearContext();
        if (httpRequest.getSession(false) != null) {
            httpRequest.getSession(false).invalidate();
        }
    }

    @PostMapping("/change-password")
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        appUserService.changePassword(username, request);
        audit.recordFor(username, AuditAction.PASSWORD_CHANGE, username + " changed their password");
    }

    @GetMapping("/me")
    public AppUserResponse me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        AppUser user = appUserRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + username));
        return toResponse(user);
    }

    private AppUserResponse toResponse(AppUser user) {
        return new AppUserResponse(
                user.getUserId(),
                user.getUsername(),
                user.getRole(),
                user.getCoachId(),
                user.getAthleteId(),
                user.getOrganizationId(),
                user.getIsActive(),
                user.getLastLogin()
        );
    }
}
