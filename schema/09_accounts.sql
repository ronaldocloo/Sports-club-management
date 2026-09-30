-- Phase 9: email addresses, password reset by email, and two-step sign-in (authenticator app).
-- Safe to run more than once.

-- An address to send password-reset links to. Optional, and unique when set.
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email VARCHAR(100) NULL;
ALTER TABLE app_user ADD UNIQUE INDEX IF NOT EXISTS uq_app_user_email (email);

-- Two-step sign-in. mfa_secret is set when someone starts enrolling and only counts once mfa_enabled is 1.
-- mfa_last_step remembers the last accepted 30-second time step so a code cannot be used twice.
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(64) NULL;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS mfa_last_step BIGINT NULL;

-- Only a hash of each reset token is stored, so a copy of the database cannot be used to reset anyone's password.
CREATE TABLE IF NOT EXISTS password_reset_token (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    INDEX idx_reset_user (user_id),
    INDEX idx_reset_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time recovery codes for when the phone is lost. Also stored hashed.
CREATE TABLE IF NOT EXISTS mfa_recovery_code (
    code_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    used_at DATETIME NULL,
    CONSTRAINT fk_recovery_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    INDEX idx_recovery_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE audit_log MODIFY action
    ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_CHANGE','EXPORT','PASSWORD_RESET','MFA_ENABLED','MFA_DISABLED') NOT NULL;
