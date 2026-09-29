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

**What the real API does not cover yet** (shown as empty states, not fake data): attendance and performance
tracking, match fixtures/results, an audit log, standalone events (the Events page is built from competitions and
facility bookings), and deactivating a user (the update endpoint requires a new password).

## Workflow

Branch off `main`, open a pull request. Schema changes route through the Schema Lead.

```bash
git checkout main && git pull
git checkout -b feature/phase4-ddl
git add . && git commit -m "message"
git push -u origin feature/phase4-ddl
```
