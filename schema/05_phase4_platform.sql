-- Phase 4: multi-organization platform, fixtures, attendance, performance, events,
-- notifications and audit log. Additive and safe to re-run. Apply after 04_phase3_auth.sql:
--   mariadb sports_club < schema/05_phase4_platform.sql
-- Schema changes route through the Schema Lead, so review before merging.

-- ---------------------------------------------------------------- organizations
CREATE TABLE IF NOT EXISTS organization (
    organization_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(60) NOT NULL,
    plan ENUM('Starter','Professional','Enterprise') NOT NULL DEFAULT 'Starter',
    status ENUM('Active','Trial','Suspended') NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_organization_name UNIQUE (name),
    CONSTRAINT uq_organization_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing data belongs to organization 1.
INSERT INTO organization (organization_id, name, slug, plan, status)
SELECT 1, 'Ashesi Sports Club', 'ashesi-sports-club', 'Professional', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM organization WHERE organization_id = 1);

-- ---------------------------------------------------------------- tenant column on every data table
-- organization_id is NOT NULL with no default once backfilled, so a row can never be saved
-- without an owner. Users may have NULL (platform Super Admins belong to no organization).

ALTER TABLE membership_type ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE sport           ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE athlete         ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE coach           ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE facility        ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE competition     ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE membership      ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE team            ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE payment         ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE facility_booking ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE team_roster     ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE team_competition ADD COLUMN IF NOT EXISTS organization_id INT NOT NULL DEFAULT 1;
ALTER TABLE app_user        ADD COLUMN IF NOT EXISTS organization_id INT NULL;
UPDATE app_user SET organization_id = 1 WHERE organization_id IS NULL AND role <> 'SuperAdmin';

ALTER TABLE app_user MODIFY role ENUM('Admin','Coach','FrontDesk','Athlete','SuperAdmin') NOT NULL;

ALTER TABLE membership_type  ADD FOREIGN KEY IF NOT EXISTS fk_membership_type_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE sport            ADD FOREIGN KEY IF NOT EXISTS fk_sport_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE athlete          ADD FOREIGN KEY IF NOT EXISTS fk_athlete_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE coach            ADD FOREIGN KEY IF NOT EXISTS fk_coach_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE facility         ADD FOREIGN KEY IF NOT EXISTS fk_facility_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE competition      ADD FOREIGN KEY IF NOT EXISTS fk_competition_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE membership       ADD FOREIGN KEY IF NOT EXISTS fk_membership_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE team             ADD FOREIGN KEY IF NOT EXISTS fk_team_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE payment          ADD FOREIGN KEY IF NOT EXISTS fk_payment_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE facility_booking ADD FOREIGN KEY IF NOT EXISTS fk_booking_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE team_roster      ADD FOREIGN KEY IF NOT EXISTS fk_roster_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE team_competition ADD FOREIGN KEY IF NOT EXISTS fk_teamcomp_org (organization_id) REFERENCES organization(organization_id);
ALTER TABLE app_user         ADD FOREIGN KEY IF NOT EXISTS fk_app_user_org (organization_id) REFERENCES organization(organization_id);

ALTER TABLE membership_type  ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE sport            ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE athlete          ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE coach            ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE facility         ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE competition      ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE membership       ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE team             ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE payment          ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE facility_booking ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE team_roster      ALTER COLUMN organization_id DROP DEFAULT;
ALTER TABLE team_competition ALTER COLUMN organization_id DROP DEFAULT;

-- Names that were unique across the whole database are now unique within an organization.
ALTER TABLE membership_type DROP INDEX IF EXISTS type_name,     ADD UNIQUE INDEX IF NOT EXISTS uq_membership_type_org_name (organization_id, type_name);
ALTER TABLE sport           DROP INDEX IF EXISTS sport_name,    ADD UNIQUE INDEX IF NOT EXISTS uq_sport_org_name (organization_id, sport_name);
ALTER TABLE coach           DROP INDEX IF EXISTS email,         ADD UNIQUE INDEX IF NOT EXISTS uq_coach_org_email (organization_id, email);
ALTER TABLE facility        DROP INDEX IF EXISTS facility_name, ADD UNIQUE INDEX IF NOT EXISTS uq_facility_org_name (organization_id, facility_name);
ALTER TABLE team            DROP INDEX IF EXISTS team_name,     ADD UNIQUE INDEX IF NOT EXISTS uq_team_org_name (organization_id, team_name);
ALTER TABLE payment         DROP INDEX IF EXISTS reference_no,  ADD UNIQUE INDEX IF NOT EXISTS uq_payment_org_reference (organization_id, reference_no);

-- ---------------------------------------------------------------- audit timestamps on existing tables
ALTER TABLE membership_type  ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE sport            ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE athlete          ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE coach            ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE facility         ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE competition      ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE membership       ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE team             ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE payment          ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE facility_booking ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE team_roster      ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE team_competition ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE app_user         ADD COLUMN IF NOT EXISTS created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, ADD COLUMN IF NOT EXISTS updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------- fixtures (matches) and results
CREATE TABLE IF NOT EXISTS fixture (
    fixture_id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    competition_id INT NOT NULL,
    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    round_label VARCHAR(50) NOT NULL DEFAULT 'Group Stage',
    venue VARCHAR(100) NULL,
    match_date DATE NOT NULL,
    match_time TIME NULL,
    officials VARCHAR(100) NULL,
    status ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
    home_score INT NULL,
    away_score INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fixture_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
    CONSTRAINT fk_fixture_competition FOREIGN KEY (competition_id) REFERENCES competition(competition_id) ON DELETE CASCADE,
    CONSTRAINT fk_fixture_home FOREIGN KEY (home_team_id) REFERENCES team(team_id),
    CONSTRAINT fk_fixture_away FOREIGN KEY (away_team_id) REFERENCES team(team_id),
    CONSTRAINT chk_fixture_teams_differ CHECK (home_team_id <> away_team_id),
    CONSTRAINT chk_fixture_scores CHECK ((home_score IS NULL AND away_score IS NULL) OR (home_score >= 0 AND away_score >= 0)),
    CONSTRAINT chk_fixture_completed_has_score CHECK (status <> 'Completed' OR (home_score IS NOT NULL AND away_score IS NOT NULL)),
    INDEX idx_fixture_competition_date (competition_id, match_date),
    INDEX idx_fixture_home (home_team_id),
    INDEX idx_fixture_away (away_team_id),
    INDEX idx_fixture_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- training sessions and attendance
CREATE TABLE IF NOT EXISTS training_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    team_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    location VARCHAR(100) NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
    CONSTRAINT fk_session_team FOREIGN KEY (team_id) REFERENCES team(team_id) ON DELETE CASCADE,
    CONSTRAINT uq_session_team_slot UNIQUE (team_id, session_date, start_time),
    INDEX idx_session_team_date (team_id, session_date),
    INDEX idx_session_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
    session_id INT NOT NULL,
    athlete_id INT NOT NULL,
    organization_id INT NOT NULL,
    status ENUM('Present','Absent','Late','Excused') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, athlete_id),
    CONSTRAINT fk_attendance_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
    CONSTRAINT fk_attendance_session FOREIGN KEY (session_id) REFERENCES training_session(session_id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_athlete FOREIGN KEY (athlete_id) REFERENCES athlete(athlete_id) ON DELETE CASCADE,
    INDEX idx_attendance_athlete (athlete_id),
    INDEX idx_attendance_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- performance records
-- stats holds sport-specific numbers as a JSON object, e.g. {"goals":2,"assists":1}.
CREATE TABLE IF NOT EXISTS performance_record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    athlete_id INT NOT NULL,
    record_date DATE NOT NULL,
    rating DECIMAL(4,1) NOT NULL,
    stats VARCHAR(1000) NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perf_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
    CONSTRAINT fk_perf_athlete FOREIGN KEY (athlete_id) REFERENCES athlete(athlete_id) ON DELETE CASCADE,
    CONSTRAINT chk_perf_rating CHECK (rating >= 0 AND rating <= 100),
    CONSTRAINT chk_perf_stats_json CHECK (stats IS NULL OR JSON_VALID(stats)),
    INDEX idx_perf_athlete_date (athlete_id, record_date),
    INDEX idx_perf_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- events
CREATE TABLE IF NOT EXISTS club_event (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    event_type ENUM('Training','Match','Competition','Awards','TeamMeeting','Workshop','ClubEvent') NOT NULL DEFAULT 'ClubEvent',
    event_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    location VARCHAR(100) NULL,
    organizer VARCHAR(100) NULL,
    description VARCHAR(500) NULL,
    status ENUM('Scheduled','Completed','Cancelled') NOT NULL DEFAULT 'Scheduled',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id),
    CONSTRAINT chk_event_times CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time),
    INDEX idx_event_date (event_date),
    INDEX idx_event_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- notifications
-- One row per recipient. dedupe_key stops the same alert being sent to a user twice.
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT NULL,
    kind ENUM('membership','payment','competition','athlete','facility','event','fixture') NOT NULL,
    message VARCHAR(255) NOT NULL,
    link VARCHAR(150) NULL,
    dedupe_key VARCHAR(100) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE SET NULL,
    CONSTRAINT uq_notification_dedupe UNIQUE (user_id, dedupe_key),
    INDEX idx_notification_user_read (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- audit log
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NULL,
    user_id INT NULL,
    username VARCHAR(50) NOT NULL,
    action ENUM('CREATE','UPDATE','DELETE','LOGIN','LOGIN_FAILED','LOGOUT','PASSWORD_CHANGE') NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(50) NULL,
    description VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_org FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE SET NULL,
    INDEX idx_audit_org_created (organization_id, created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------- extra indexes for common lookups
ALTER TABLE payment            ADD INDEX IF NOT EXISTS idx_payment_membership (membership_id);
ALTER TABLE membership         ADD INDEX IF NOT EXISTS idx_membership_athlete (athlete_id);
ALTER TABLE team_roster        ADD INDEX IF NOT EXISTS idx_roster_athlete (athlete_id);
ALTER TABLE facility_booking   ADD INDEX IF NOT EXISTS idx_booking_date (booking_date);
