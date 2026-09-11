# Phase 7 - Database Security

**Owner:** Ronald Ocloo  
**DBMS:** MariaDB 10.x  
**Database:** `sports_club`

This folder delivers the project’s database-security requirements:

- Three database roles: `admin`, `front_desk`, and `coach`.
- Least-privilege grants implementing BR7.
- Application password-hashing and role-based-access guidance for `app_user`.
- A tested backup and restore process using `mysqldump`.
- Test cases for permissions, application RBAC, and recovery.

## File order

1. Run `01_roles_and_grants.sql` as a MariaDB administrator after the schema and seed data have been loaded.
2. Create three local test accounts from the commented section at the end of that script. Use passwords supplied outside Git.
3. Run the checks in `04_security_test_cases.md` and retain the output as evidence.
4. Run and document a backup/restore according to `03_backup_restore_runbook.md`.

## Security model

| Role | Allowed work | Not allowed |
|---|---|---|
| `admin` | Full control of the `sports_club` database | N/A within this project database |
| `front_desk` | Read operational records; add/edit athletes and memberships; record new payments | DDL, deleting or updating payment records, managing users, routine/trigger creation |
| `coach` | Read roster information needed by coach screens | Payment and membership data, writes, DDL |

`app_user.role` controls what a person sees in the application. `app_user.coach_id` identifies a coach; the application must filter roster queries by the logged-in coach’s `coach_id`. MariaDB roles control database-object access, while the application controls the individual coach’s row-level scope.

The front-desk role receives `INSERT` but **not** `UPDATE` or `DELETE` on `payment`. This is the least-privilege control that ensures a front-desk account can record a payment but cannot alter a completed payment. If the team later needs front desk to change a pending payment, Samira must expose a controlled stored procedure or trigger-protected routine; do not grant direct `UPDATE` on `payment`.
