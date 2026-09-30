package com.dev.sports_club.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Small request bodies for the account endpoints (password reset, email, two-step sign-in). */
public final class AuthRequests {

    private AuthRequests() { }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank @Size(max = 100)
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank @Size(max = 200)
        private String token;
        @NotBlank @Size(min = 8, max = 100)
        private String newPassword;
    }

    @Data
    public static class EmailRequest {
        @Email @Size(max = 100)
        private String email;
    }

    @Data
    public static class CodeRequest {
        @NotBlank @Size(max = 20)
        private String code;
    }

    @Data
    public static class DisableMfaRequest {
        @NotBlank
        private String password;
        @NotBlank @Size(max = 20)
        private String code;
    }
}
