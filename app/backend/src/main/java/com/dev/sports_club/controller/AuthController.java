package com.dev.sports_club.controller;

import com.dev.sports_club.dto.AppUserResponse;
import com.dev.sports_club.dto.ChangePasswordRequest;
import com.dev.sports_club.entity.AuditAction;
import com.dev.sports_club.service.AppUserService;
import com.dev.sports_club.service.AuditService;
import com.dev.sports_club.service.MfaService;
import com.dev.sports_club.service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;
import com.dev.sports_club.dto.LoginRequest;
import com.dev.sports_club.dto.AuthRequests.*;
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
    private final MfaService mfaService;
    private final PasswordResetService passwordReset;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            appUserService.recordFailedLogin(request.getUsername());
            audit.recordFor(request.getUsername(), AuditAction.LOGIN_FAILED, "Failed sign-in for " + request.getUsername());
            throw e;
        }

        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + request.getUsername()));

        // Two-step sign-in: the password was right, now the code. Nothing is signed in until both pass, and a wrong
        // code counts towards the same lockout as a wrong password.
        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            if (request.getCode() == null || request.getCode().isBlank()) {
                return ResponseEntity.status(401).body(Map.of("status", 401, "error", "MFA_REQUIRED", "message", "Enter the 6-digit code from your authenticator app"));
            }
            if (!mfaService.verifyLogin(user, request.getCode())) {
                appUserService.recordFailedLogin(request.getUsername());
                audit.recordFor(request.getUsername(), AuditAction.LOGIN_FAILED, "Wrong two-step code for " + request.getUsername());
                return ResponseEntity.status(401).body(Map.of("status", 401, "error", "Unauthorized", "message", "Invalid username, password or code"));
            }
            user = appUserRepository.findByUsername(request.getUsername()).orElseThrow();   // pick up the accepted time step
        }

        // Issue a fresh session id on login so a pre-login session id can never be reused (session fixation).
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        user.setLastLogin(LocalDateTime.now());
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        appUserRepository.save(user);
        audit.recordFor(user.getUsername(), AuditAction.LOGIN, user.getUsername() + " signed in");

        return ResponseEntity.ok(toResponse(user));
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

    /** What this server can do, so the sign-in page only offers what works. Public. */
    @GetMapping("/capabilities")
    public Map<String, Object> capabilities() {
        return Map.of("passwordResetByEmail", passwordReset.isAvailable());
    }

    /** Always answers the same way, so it cannot be used to find out which addresses have accounts. */
    @PostMapping("/forgot-password")
    @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordReset.request(request.getEmail());
        return Map.of("message", "If that address belongs to an account, a reset link is on its way.");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordReset.reset(request.getToken(), request.getNewPassword());
        return Map.of("message", "Your password has been changed. You can sign in now.");
    }

    @PutMapping("/email")
    public AppUserResponse setEmail(@Valid @RequestBody EmailRequest request) {
        return appUserService.setOwnEmail(SecurityContextHolder.getContext().getAuthentication().getName(), request.getEmail());
    }

    @PostMapping("/mfa/setup")
    public Map<String, String> mfaSetup() {
        return mfaService.setup(SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @PostMapping("/mfa/enable")
    public Map<String, List<String>> mfaEnable(@Valid @RequestBody CodeRequest request) {
        return Map.of("recoveryCodes", mfaService.enable(SecurityContextHolder.getContext().getAuthentication().getName(), request.getCode()));
    }

    @PostMapping("/mfa/disable")
    public void mfaDisable(@Valid @RequestBody DisableMfaRequest request) {
        mfaService.disable(SecurityContextHolder.getContext().getAuthentication().getName(), request.getPassword(), request.getCode());
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
                user.getLastLogin(),
                user.getEmail(),
                Boolean.TRUE.equals(user.getMfaEnabled())
        );
    }
}
