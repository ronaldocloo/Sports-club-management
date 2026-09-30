package com.dev.sports_club.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    // Six-digit authenticator code or a recovery code; only needed when two-step sign-in is on.
    @jakarta.validation.constraints.Size(max = 20)
    private String code;
}
