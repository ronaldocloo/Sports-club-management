-- Phase 6b test cases. Run in a test database or use rollback/known test data.
USE sports_club;

-- Test functions using known seeded IDs.
SELECT fn_membership_outstanding_balance(1) AS membership_1_outstanding_balance;
SELECT fn_athlete_age(1) AS athlete_1_age;
SELECT fn_team_active_roster_count(1) AS team_1_active_roster_count;

-- Test procedure: record a valid payment only where the remaining balance permits it.
-- CALL sp_record_payment(1, 10.00, 'Cash', NULL);

-- Test failed payment: amount exceeds balance. Expected: SQLSTATE 45000.
-- CALL sp_record_payment(1, 999999.99, 'Cash', NULL);

-- Test roster trigger using an athlete with no current active membership.
-- Expected: SQLSTATE 45000.
-- INSERT INTO team_roster (team_id, athlete_id, position) VALUES (1, <inactive_athlete_id>, 'Trial');

-- Test active membership trigger. Expected: SQLSTATE 45000 where athlete already has Active membership.
-- INSERT INTO membership (athlete_id, type_id, start_date, end_date, amount_charged, status)
-- VALUES (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 50.00, 'Active');

-- Test active-membership update trigger. Expected: SQLSTATE 45000 when another
-- membership for the athlete is already Active.
-- UPDATE membership SET status = 'Active' WHERE membership_id = <expired_membership_id>;

-- Confirm installed objects.
SHOW PROCEDURE STATUS WHERE Db = 'sports_club';
SHOW FUNCTION STATUS WHERE Db = 'sports_club';
SHOW TRIGGERS FROM sports_club;
