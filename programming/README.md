# Phase 6b - Database Programming

**Owner:** Samira Donkoh  
**DBMS:** MariaDB 10.x / XAMPP  
**Database:** `sports_club`

This package implements database-side business logic using three stored procedures, two functions, and three triggers.

## Installation order

1. Load the schema scripts and seed data for `sports_club`.
2. Run `01_procedures_and_functions.sql` as a database administrator.
3. Run `02_triggers.sql`.
4. Run `03_programming_test_cases.sql` and save its output as evidence.

## Implemented rules

| Object | Purpose |
|---|---|
| `sp_register_athlete_with_membership` | Registers an athlete, creates a membership, and records the first payment as one transaction. |
| `sp_renew_membership` | Inserts a new membership row to preserve membership history. |
| `sp_record_payment` | Records a payment and prevents duplicate transaction references. |
| `fn_membership_outstanding_balance` | Returns the remaining balance for a membership. |
| `fn_athlete_age` | Returns an athlete’s current age. |
| `fn_team_active_roster_count` | Returns a team’s active roster count. |
| `trg_roster_requires_active_membership` | Prevents assigning an athlete to a team without an active membership. |
| `trg_membership_one_active_insert` | Prevents a second active membership on insert. |
| `trg_membership_one_active_update` | Prevents an update from turning a second membership into an active membership. |

## Important integration note

The security role script should grant `EXECUTE` on the three procedures to `front_desk` instead of granting direct write access where the team wants all writes to pass through these rules. Payment changes remain restricted by database privileges: front desk has `INSERT` but not `UPDATE` or `DELETE` on `payment`.
