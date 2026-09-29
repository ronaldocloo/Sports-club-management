# Testing

Three layers, all run in CI (`.github/workflows/ci.yml`).

## 1. Backend (JUnit 5 + MockMvc + a real MariaDB)

Integration tests go through the real Spring Security chain, sessions, CSRF and the database, so they check what a
browser would actually get. They use a separate database, never the development one.

```bash
scripts/setup-test-db.sh            # once, and whenever the schema changes (DB_ADMIN_ARGS="-uroot -p" if needed)
cd app/backend && ./mvnw -B test
```

| Suite | What it proves |
|---|---|
| `AuthIntegrationTest` (15) | login, lockout after 5 failures, session expiry, CSRF, security headers, password policy |
| `TenantIsolationIntegrationTest` (10) | one organization cannot read, edit or delete another's rows, by id or by list |
| `AuthorizationMatrixIntegrationTest` (109) | each role gets exactly the allowed status on each endpoint |
| `DataScopeIntegrationTest` (4) | coaches see only their teams, athletes only themselves |
| `BusinessRulesIntegrationTest` (21) | payments, memberships, bookings, registration deadline, fixtures and standings, attendance, performance, events, notifications, daily job, audit trail |
| `AnalyticsReportsIntegrationTest` (21) | exact KPIs and period comparison, report rows and totals, real CSV/XLSX/PDF files, role access, audited exports |
| `IntelligenceIntegrationTest` (21) | retention ranking, exact forecast on a known series, anomaly detection, nudges, scoping |
| `unit/*` (36) | trend maths, retention scorer boundaries, password policy, rate limiter, exporters |

Tests build their own data (`IntegrationTestBase` helpers) and roll back, so they are order independent.

## 2. Frontend (Vitest + Testing Library)

```bash
cd app/frontend && npm test
```

Covers role permissions, date ranges, money and date formatting, the trend and retention maths (case for case the same as
the backend, so demo mode and the real API agree), membership status, the password policy, CSV export (including formula
injection), the data joins that build athlete profiles, and the components people touch: login, route guards, modals and
confirm dialogs, stat cards, the date picker, the athlete and coach forms, and role-based sidebar filtering.

## 3. End to end (Playwright, demo mode)

```bash
cd app/frontend && npm run test:e2e     # uses your installed Chrome; set PLAYWRIGHT_CHANNEL=chromium in CI
```

Starts the app in demo mode on port 5199 and walks the investor flow: sign out and in, add an athlete with validation and
open the profile, analytics range change, intelligence, a CSV report download, and switching role to see the sidebar and
access change. No backend or database is needed.

## Not covered (yet)

- Playwright against the real backend (the API is covered by the integration tests instead).
- Load and performance tests.
- Browser and device matrix beyond Chrome.
