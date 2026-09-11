-- =====================================================================
-- queries/02_queries.sql
-- Sports Club Management System — Phase 6a Advanced Queries
-- Owner: Richard Yemoh (Data and Query Lead)
--
-- 10 queries, each using at least one of: joins, subqueries,
-- aggregates, grouping. Run against schema + data/01_seed.sql.
-- =====================================================================

USE sports_club;

-- ---------------------------------------------------------------------
-- Q1. Active members with their membership type and days remaining
-- (join + computed column)
-- ---------------------------------------------------------------------
SELECT
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    mt.type_name,
    m.start_date,
    m.end_date,
    DATEDIFF(m.end_date, CURDATE()) AS days_remaining
FROM membership m
JOIN athlete a          ON a.athlete_id = m.athlete_id
JOIN membership_type mt ON mt.type_id   = m.type_id
WHERE m.status = 'Active'
ORDER BY days_remaining ASC;

-- ---------------------------------------------------------------------
-- Q2. Revenue collected per membership type (join + aggregate + group by)
-- Only counts Completed payments.
-- ---------------------------------------------------------------------
SELECT
    mt.type_name,
    COUNT(p.payment_id)   AS completed_payments,
    SUM(p.amount)          AS total_revenue,
    ROUND(AVG(p.amount),2) AS avg_payment
FROM payment p
JOIN membership m       ON m.membership_id = p.membership_id
JOIN membership_type mt ON mt.type_id      = m.type_id
WHERE p.status = 'Completed'
GROUP BY mt.type_name
ORDER BY total_revenue DESC;

-- ---------------------------------------------------------------------
-- Q3. Athletes with more than one Active/Expired/Suspended membership
-- record (aggregate + group by + having) — flags renewal history.
-- ---------------------------------------------------------------------
SELECT
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    COUNT(m.membership_id) AS membership_count
FROM athlete a
JOIN membership m ON m.athlete_id = a.athlete_id
GROUP BY a.athlete_id, athlete_name
HAVING COUNT(m.membership_id) > 1
ORDER BY membership_count DESC;

-- ---------------------------------------------------------------------
-- Q4. Athletes who currently hold NO active membership but are still on
-- a team roster (subquery with NOT IN) — a compliance check tied to BR1.
-- ---------------------------------------------------------------------
SELECT DISTINCT
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name
FROM athlete a
JOIN team_roster tr ON tr.athlete_id = a.athlete_id AND tr.is_active = 1
WHERE a.athlete_id NOT IN (
    SELECT athlete_id FROM membership WHERE status = 'Active'
);

-- ---------------------------------------------------------------------
-- Q5. Team roster headcount per team, with coach and sport
-- (multi-table join + aggregate + group by)
-- ---------------------------------------------------------------------
SELECT
    t.team_id,
    t.team_name,
    s.sport_name,
    CONCAT(c.first_name, ' ', c.last_name) AS coach_name,
    COUNT(tr.athlete_id) AS active_roster_size
FROM team t
JOIN sport s  ON s.sport_id  = t.sport_id
JOIN coach c  ON c.coach_id  = t.coach_id
LEFT JOIN team_roster tr ON tr.team_id = t.team_id AND tr.is_active = 1
GROUP BY t.team_id, t.team_name, s.sport_name, coach_name
ORDER BY active_roster_size DESC;

-- ---------------------------------------------------------------------
-- Q6. Facility utilisation: confirmed bookings per facility, and the
-- facility's capacity (join + aggregate + group by)
-- ---------------------------------------------------------------------
SELECT
    f.facility_id,
    f.facility_name,
    f.facility_type,
    f.status,
    COUNT(fb.booking_id) AS confirmed_bookings
FROM facility f
LEFT JOIN facility_booking fb
       ON fb.facility_id = f.facility_id AND fb.status = 'Confirmed'
GROUP BY f.facility_id, f.facility_name, f.facility_type, f.status
ORDER BY confirmed_bookings DESC;

-- ---------------------------------------------------------------------
-- Q7. Teams competing in more competitions than the club average
-- (subquery in HAVING using a scalar subquery + aggregate)
-- ---------------------------------------------------------------------
SELECT
    t.team_id,
    t.team_name,
    COUNT(tc.competition_id) AS competitions_entered
FROM team t
JOIN team_competition tc ON tc.team_id = t.team_id
GROUP BY t.team_id, t.team_name
HAVING COUNT(tc.competition_id) > (
    SELECT AVG(entry_count) FROM (
        SELECT COUNT(*) AS entry_count
        FROM team_competition
        GROUP BY team_id
    ) AS per_team
)
ORDER BY competitions_entered DESC;

-- ---------------------------------------------------------------------
-- Q8. Outstanding (Pending or Failed) payments with athlete and coach
-- contact details, for front-desk follow-up (multi-join)
-- ---------------------------------------------------------------------
SELECT
    p.payment_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    a.phone,
    mt.type_name,
    p.amount,
    p.status,
    p.payment_date
FROM payment p
JOIN membership m       ON m.membership_id = p.membership_id
JOIN athlete a           ON a.athlete_id    = m.athlete_id
JOIN membership_type mt  ON mt.type_id      = m.type_id
WHERE p.status IN ('Pending', 'Failed')
ORDER BY p.payment_date ASC;

-- ---------------------------------------------------------------------
-- Q9. Athletes on more than one team roster (self-describing multi-sport
-- athletes) — join + group by + having, feeds a "multi-team" report.
-- ---------------------------------------------------------------------
SELECT
    a.athlete_id,
    CONCAT(a.first_name, ' ', a.last_name) AS athlete_name,
    COUNT(DISTINCT tr.team_id) AS teams_joined,
    GROUP_CONCAT(DISTINCT t.team_name ORDER BY t.team_name SEPARATOR ', ') AS teams
FROM athlete a
JOIN team_roster tr ON tr.athlete_id = a.athlete_id
JOIN team t          ON t.team_id    = tr.team_id
GROUP BY a.athlete_id, athlete_name
HAVING COUNT(DISTINCT tr.team_id) > 1;

-- ---------------------------------------------------------------------
-- Q10. Upcoming facility bookings in the next 7 days from today's date,
-- with the requesting team's sport and coach (join + date filter +
-- correlated subquery for a same-day booking count on that facility)
-- ---------------------------------------------------------------------
SELECT
    fb.booking_id,
    f.facility_name,
    fb.booking_date,
    fb.time_slot,
    t.team_name,
    s.sport_name,
    CONCAT(c.first_name, ' ', c.last_name) AS coach_name,
    (SELECT COUNT(*) FROM facility_booking fb2
      WHERE fb2.facility_id = fb.facility_id
        AND fb2.booking_date = fb.booking_date
        AND fb2.status = 'Confirmed') AS bookings_same_day_same_facility
FROM facility_booking fb
JOIN facility f ON f.facility_id = fb.facility_id
JOIN team t     ON t.team_id     = fb.team_id
JOIN sport s    ON s.sport_id    = t.sport_id
JOIN coach c    ON c.coach_id    = t.coach_id
WHERE fb.status = 'Confirmed'
  AND fb.booking_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY fb.booking_date, fb.time_slot;
