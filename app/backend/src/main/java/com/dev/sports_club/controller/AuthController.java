package com.dev.sports_club.controller;

import com.dev.sports_club.dto.AppUserResponse;
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

    @PostMapping("/login")
    public AppUserResponse login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUser user = appUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("AppUser not found: " + request.getUsername()));
        user.setLastLogin(LocalDateTime.now());
        appUserRepository.save(user);

        return toResponse(user);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest httpRequest) {
        SecurityContextHolder.clearContext();
        if (httpRequest.getSession(false) != null) {
            httpRequest.getSession(false).invalidate();
        }
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
                user.getIsActive(),
                user.getLastLogin()
        );
    }
}
