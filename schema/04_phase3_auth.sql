-- Phase 3: authentication and role extensions.
-- Additive migration; safe to run more than once. Apply after 02_tables.sql, as a MariaDB admin:
--   mariadb sports_club < schema/04_phase3_auth.sql
-- Schema changes route through the Schema Lead, so review before merging.

-- New application role for athletes viewing their own record.
ALTER TABLE app_user
    MODIFY role ENUM('Admin','Coach','FrontDesk','Athlete') NOT NULL;

-- Link an athlete account to its athlete record (one account per athlete).
ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS athlete_id INT NULL AFTER coach_id;

ALTER TABLE app_user
    ADD FOREIGN KEY IF NOT EXISTS fk_app_user_athlete (athlete_id)
        REFERENCES athlete(athlete_id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE app_user
    ADD UNIQUE INDEX IF NOT EXISTS uq_app_user_athlete (athlete_id);
