# Sports Club Management System

Database systems final project (CS323). MariaDB.

## Team

| Role | Member |
|---|---|
| Database / Schema Lead | David Acheampong Awuah |
| Data & Query Lead | Richard Yemoh |
| Programming & Security Leads | Samira Donkoh, Ronald Ocloo |
| Application | Whole team |

## Repository structure

| Folder | Contents |
|---|---|
| `schema/` | DDL scripts, constraints, indexes |
| `data/` | DML seed scripts |
| `queries/` | Queries, views, procedures, functions, triggers |
| `security/` | Roles, privileges, backup strategy |
| `app/` | Application source |
| `docs/` | ER diagram, data dictionary, normalization notes, test cases |

## Setup

Requires MariaDB (XAMPP or standalone).

```bash
mysql -u root -p < schema/01_create_database.sql
mysql -u root -p sports_club < schema/02_tables.sql
mysql -u root -p sports_club < data/01_seed.sql
mysql -u root -p sports_club < schema/04_phase3_auth.sql   # Athlete role + account linking (safe to re-run)
mysql -u root -p sports_club < schema/05_phase4_platform.sql # organizations, fixtures, attendance, events, audit (safe to re-run)
mysql -u root -p sports_club < schema/06_phase5_reporting.sql # report export audit action + indexes (safe to re-run)
```

Copy `.env.example` to `.env` and fill in local credentials. Never commit `.env`.

## Running the full stack (development)

1. Load the database (see Setup above), then create a **development-only** database account for the app.
   The backend defaults to `sportsteam` / `sportsteam` (see `application.properties`); use your own values via
   `DB_USER` / `DB_PASSWORD` if you prefer.

   ```sql
   CREATE USER IF NOT EXISTS 'sportsteam'@'localhost' IDENTIFIED BY 'sportsteam';
   GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON sports_club.* TO 'sportsteam'@'localhost';
   ```

2. The seed users have placeholder password hashes, so nobody can log in until you set one locally.
   Generate a bcrypt hash and update a user in **your local database only** (never commit real passwords):

   ```bash
   htpasswd -bnBC 10 "" 'choose-a-password' | tr -d ':\n' | sed 's/^\$2y/$2a/'
   ```

   ```sql
   UPDATE app_user SET password_hash = '<hash from above>' WHERE username = 'admin';
   ```

3. Start the backend (port 8080) and the frontend (port 5173, proxies `/api` to the backend):

   ```bash
   cd app/backend && ./mvnw spring-boot:run
   cd app/frontend && npm install && npm run dev
   ```

**Demo mode.** To browse the whole UI with sample data and no backend, create `app/frontend/.env.local` containing
`VITE_DEMO_MODE=true` and restart `npm run dev`. Remove the file to use the real API. In demo mode a
"View as" menu lets you preview each role.

**Organizations (multi-tenant).** Every data table belongs to an organization and each request only sees its own
organization's rows. Existing data is placed in organization 1. A platform **Super Admin** (no organization) creates
organizations and works inside one at a time from the top bar. There is no Super Admin in the seed; create one locally
(generate a hash as in step 2 above):

```sql
INSERT INTO app_user (username, password_hash, role, organization_id, is_active)
VALUES ('superadmin', '<bcrypt hash>', 'SuperAdmin', NULL, 1);
```

**Analytics and reports.** `GET /api/analytics/overview?from=&to=` (Admin) aggregates KPIs for any date range up to 800
days and compares each with the previous period of the same length, plus insights and an "attention" list.
`GET /api/reports/{type}` builds seven reports (athletes, memberships, financial, attendance, performance, facilities,
competitions) as JSON (preview) or as real CSV, `.xlsx` (Apache POI) and PDF (OpenPDF) files. Front Desk can run the
first three, Coaches the attendance and performance reports for their own teams. Every export is written to the audit log.

**Daily job.** At 06:00 server time the backend marks memberships past their end date as Expired and sends expiry
warnings (an Admin can also trigger it: `POST /api/admin/jobs/run`, for their own organization only). Seed memberships
with past end dates will therefore become Expired the first time it runs.

**Still demo-only:** the Super Admin "view as" role switcher and sample data exist only in demo mode. Login lockout and
email (password reset, notification emails) are not implemented.

## Workflow

Branch off `main`, open a pull request. Schema changes route through the Schema Lead.

```bash
git checkout main && git pull
git checkout -b feature/phase4-ddl
git add . && git commit -m "message"
git push -u origin feature/phase4-ddl
```
