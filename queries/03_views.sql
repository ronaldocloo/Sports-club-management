-- =====================================================================
-- queries/03_views.sql
-- Sports Club Management System — Phase 6a Reporting Views
-- Owner: Richard Yemoh (Data and Query Lead)
--
-- 5 views covering common reporting needs. These back the search/filter
-- (FR8) and reporting (FR9) screens in the application layer.
-- =====================================================================

USE sports_club;

-- ---------------------------------------------------------------------
-- V1. vw_active_members
-- All athletes with a currently Active membership, plus how many days
-- are left before it expires. Backs the FR8 member search screen.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_active_members AS
SELECT
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    a.email,
    a.phone,
    mt.type_name AS membership_type,
    m.membership_id,
    m.start_date,
    m.end_date,
    DATEDIFF(m.end_date, CURDATE()) AS days_remaining
FROM membership m
JOIN athlete a          ON a.athlete_id = m.athlete_id
JOIN membership_type mt ON mt.type_id   = m.type_id
WHERE m.status = 'Active';

-- ---------------------------------------------------------------------
-- V2. vw_revenue_by_period
-- Monthly revenue from Completed payments only. Backs FR9 financial
-- reporting; the app filters this by year/month as needed.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_revenue_by_period AS
SELECT
    DATE_FORMAT(p.payment_date, '%Y-%m') AS revenue_month,
    p.method,
    COUNT(*)          AS payment_count,
    SUM(p.amount)      AS total_revenue
FROM payment p
WHERE p.status = 'Completed'
GROUP BY revenue_month, p.method;

-- ---------------------------------------------------------------------
-- V3. vw_upcoming_bookings
-- All confirmed facility bookings from today onward, with team and
-- facility context. Backs the FR9 facility usage report.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_upcoming_bookings AS
SELECT
    fb.booking_id,
    f.facility_name,
    f.facility_type,
    fb.booking_date,
    fb.time_slot,
    t.team_name,
    s.sport_name,
    fb.purpose
FROM facility_booking fb
JOIN facility f ON f.facility_id = fb.facility_id
JOIN team t     ON t.team_id     = fb.team_id
JOIN sport s    ON s.sport_id    = t.sport_id
WHERE fb.status = 'Confirmed'
  AND fb.booking_date >= CURDATE();

-- ---------------------------------------------------------------------
-- V4. vw_outstanding_payments
-- Pending or Failed payments needing front-desk follow-up. Backs the
-- FR9 payments-due report and FR8 payment search/filter.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_outstanding_payments AS
SELECT
    p.payment_id,
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    a.phone,
    mt.type_name AS membership_type,
    p.amount,
    p.method,
    p.status,
    p.payment_date
FROM payment p
JOIN membership m       ON m.membership_id = p.membership_id
JOIN athlete a           ON a.athlete_id    = m.athlete_id
JOIN membership_type mt  ON mt.type_id      = m.type_id
WHERE p.status IN ('Pending', 'Failed');

-- ---------------------------------------------------------------------
-- V5. vw_team_rosters
-- Active team roster listing with sport and coach, for the FR8 team
-- search screen and FR9 roster reports.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_team_rosters AS
SELECT
    t.team_id,
    t.team_name,
    s.sport_name,
    CONCAT(c.first_name, ' ', c.last_name) AS coach_name,
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    tr.position,
    tr.date_joined
FROM team_roster tr
JOIN team t    ON t.team_id    = tr.team_id
JOIN sport s   ON s.sport_id   = t.sport_id
JOIN coach c   ON c.coach_id   = t.coach_id
JOIN athlete a ON a.athlete_id = tr.athlete_id
WHERE tr.is_active = 1;
