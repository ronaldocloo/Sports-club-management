-- Sports Club Management System - Phase 7 Database Security
-- Owner: Ronald Ocloo
-- Target: MariaDB 10.x / XAMPP
-- Run as a MariaDB administrator after schema/02_tables.sql and seed data.

-- Remove and recreate project roles so this script is repeatable in development.
DROP ROLE IF EXISTS 'admin';
DROP ROLE IF EXISTS 'front_desk';
DROP ROLE IF EXISTS 'coach';

CREATE ROLE 'admin';
CREATE ROLE 'front_desk';
CREATE ROLE 'coach';

-- ADMIN: project database administrator.
GRANT ALL PRIVILEGES ON sports_club.* TO 'admin';

-- FRONT DESK: operational lookups required when registering athletes, memberships,
-- and payments. It has no DDL or user-management privileges.
GRANT SELECT ON sports_club.membership_type TO 'front_desk';
GRANT SELECT ON sports_club.athlete TO 'front_desk';
GRANT SELECT ON sports_club.membership TO 'front_desk';
GRANT SELECT ON sports_club.payment TO 'front_desk';

-- Front-desk staff may create or correct athlete/membership records. No DELETE is
-- granted: financial and membership history must be retained.
GRANT INSERT, UPDATE ON sports_club.athlete TO 'front_desk';
GRANT INSERT, UPDATE ON sports_club.membership TO 'front_desk';
-- A front-desk user can record a new payment but cannot change any payment later.
-- In particular, this prevents altering a Completed payment as required by Phase 7.
GRANT INSERT ON sports_club.payment TO 'front_desk';

-- COACH: read-only access to roster-related records.
-- Deliberately NO grants on membership, membership_type, payment, or app_user.
GRANT SELECT ON sports_club.coach TO 'coach';
GRANT SELECT ON sports_club.sport TO 'coach';
GRANT SELECT ON sports_club.team TO 'coach';
GRANT SELECT ON sports_club.team_roster TO 'coach';
GRANT SELECT ON sports_club.athlete TO 'coach';

-- Display grants for submission/testing evidence.
SHOW GRANTS FOR 'admin';
SHOW GRANTS FOR 'front_desk';
SHOW GRANTS FOR 'coach';

-- OPTIONAL: development test accounts. Uncomment only on a local XAMPP installation.
-- Never commit real passwords. Each database account must have a unique strong password.
--
-- CREATE USER IF NOT EXISTS 'sc_admin_test'@'localhost' IDENTIFIED BY '<strong-password>';
-- CREATE USER IF NOT EXISTS 'sc_frontdesk_test'@'localhost' IDENTIFIED BY '<strong-password>';
-- CREATE USER IF NOT EXISTS 'sc_coach_test'@'localhost' IDENTIFIED BY '<strong-password>';
-- GRANT 'admin' TO 'sc_admin_test'@'localhost';
-- GRANT 'front_desk' TO 'sc_frontdesk_test'@'localhost';
-- GRANT 'coach' TO 'sc_coach_test'@'localhost';
-- SET DEFAULT ROLE 'admin' TO 'sc_admin_test'@'localhost';
-- SET DEFAULT ROLE 'front_desk' TO 'sc_frontdesk_test'@'localhost';
-- SET DEFAULT ROLE 'coach' TO 'sc_coach_test'@'localhost';
