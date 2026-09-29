-- Phase 7: login lockout. Additive and safe to re-run. Apply after 06_phase5_reporting.sql.
-- After 5 wrong passwords an account is locked for 15 minutes; a correct sign-in or an
-- administrator's password reset clears the counter.
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL;
