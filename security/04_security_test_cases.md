# Security Test Cases and Evidence

Run these after creating the test accounts in `01_roles_and_grants.sql`. Save each command and result as screenshots or text output.

| ID | Account / action | Expected result |
|---|---|---|
| SEC-01 | Administrator runs `SHOW GRANTS FOR 'admin'`. | `admin` has full privileges on `sports_club` only. |
| SEC-02 | Front-desk account inserts a valid payment or updates a valid membership status. | Operation succeeds. |
| SEC-03 | Front-desk account attempts `UPDATE payment SET status = 'Refunded' WHERE payment_id = <completed_id>`. | Permission denied; completed payment remains unchanged. |
| SEC-04 | Front-desk account runs `ALTER TABLE payment ADD COLUMN test_col INT`. | Permission denied. |
| SEC-05 | Coach account queries `team`, `team_roster`, and `athlete`. | Read succeeds. |
| SEC-06 | Coach account runs `SELECT * FROM payment`. | Permission denied. |
| SEC-07 | Coach account runs `UPDATE team_roster SET is_active = FALSE WHERE ...`. | Permission denied. |
| SEC-08 | Coach account runs `INSERT INTO membership (...) VALUES (...)`. | Permission denied. |
| SEC-09 | Application login with an inactive `app_user` (`is_active = FALSE`). | Login is rejected. |
| SEC-10 | Logged-in coach opens roster screen. | Only teams where `team.coach_id` equals that user’s `app_user.coach_id` are returned. |
| SEC-11 | Inspect `app_user.password_hash` after a user is created. | A hash is stored; plaintext password is absent. |
| SEC-12 | Follow the backup/restore runbook. | Restored database has matching table/row/routine/trigger checks. |

## Suggested SQL for negative permission tests

```sql
-- Connect using the relevant test account first.
USE sports_club;
SELECT * FROM payment;
UPDATE team_roster SET is_active = FALSE WHERE team_id = 1 AND athlete_id = 1;
DELETE FROM payment WHERE payment_id = 1;
UPDATE payment SET status = 'Refunded' WHERE payment_id = 1;
ALTER TABLE payment ADD COLUMN test_col INT;
```

Negative tests are successful when MariaDB denies the operation. After each attempted modification, use an administrator account to confirm that the affected row did not change.
