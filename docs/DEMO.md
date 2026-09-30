# Investor demo

Everything below is built into the product and can be shown live. Nothing on this page needs slides.

## Three ways to run it

| | Good for | How |
|---|---|---|
| **A. Static demo** | sharing a link, phones, no setup | `cd app/frontend && npm run build:demo`, then upload the `dist-demo/` folder to any static host (Netlify, Vercel, GitHub Pages, S3). It runs entirely in the browser on sample data. A "View as" menu switches role. Not the real backend, so say so if asked. |
| **B. Real stack, seeded** | the live demo | Docker: `DEMO_SEED=true` in `.env`, then `docker compose up -d --build` (see `docs/DEPLOYMENT.md`). Real API, real database, real permissions. |
| **C. Local, no Docker** | development | Start MariaDB and load `schema/02`-`07`, then run the backend with `APP_DEMO_SEED=true`, and `npm run dev` in `app/frontend`. |

For B and C the backend seeds one organization, **Accra Lions Academy**, the first time it starts (and never again if it
already exists). It prints the demo accounts and, unless `DEMO_PASSWORD` is set, a random shared password:

```bash
docker compose logs backend | grep "Password for all"
```

| Account | Role | Shows |
|---|---|---|
| `demo.admin` | Club Admin | everything: analytics, intelligence, users, reports |
| `demo.frontdesk` | Front Desk | members, payments, bookings, retention list |
| `demo.coach` | Coach | own teams, attendance, results, their athletes only |
| `demo.athlete` | Athlete | their own profile, attendance, ratings and insight |

### What the seeded club looks like

72 athletes across 8 teams and 4 sports, 6 coaches, 6 facilities (one under maintenance), about 350 memberships and 360
payments over the last 20 months, 12 weeks of training attendance and performance ratings, a league in progress with
results and a table, a finished cup, a competition with registration open and one nobody has entered yet.
Dates are generated from today, so it always looks current. The data is deterministic: it is the same club every time,
so the demo is repeatable, and it is **synthetic**. Say so.

It is built to contain real stories for the intelligence features to find: about a dozen athletes drifting away (falling
attendance, membership about to end), a few lapsed members, one duplicated payment, one member with two failed payments and
one payment stuck pending for weeks.

## A ten-minute walkthrough (sign in as `demo.admin`)

1. **Dashboard (1 min).** "One place for the whole organization." Point at growth versus last month, active memberships and
   how many expire within 30 days, outstanding payments, facility use, and the plain-English insights list.
2. **Athletes (1 min).** Search, filter by sport or membership. Open one profile: team, coach, membership and payment state,
   attendance, rating trend, and an insight card with the reason for each statement.
3. **Analytics (2 min).** Change the date range. Every figure is compared with the previous period of the same length. Show the
   attention list and the outstanding balance. "Every number here is computed on the server from the same records you
   just saw, and reports export the same figures."
4. **Intelligence (3 min), the centrepiece.**
   - *Retention risk:* ranked athletes with a score, the named reasons behind every point, and a suggested action. "Not a black
     box: you can check the reasoning." Press **Remind** on someone with an account: a person decides, the system never
     messages anyone by itself.
   - *Forecast:* 12 months of revenue, a 3-month straight-line projection with its range, and the renewal pipeline.
     "It says how uncertain it is, and it refuses to forecast with fewer than four months of data."
   - *Unusual activity:* the duplicated payment, the repeated failures, the stale pending payment.
   - *Facility demand:* busiest and quietest slots with a recommendation.
5. **Reports (1 min).** Pick Financial, choose a period, download **Excel** or **PDF**. These are real files generated on the
   server, and every export is recorded in the audit log.
6. **Roles and security (1 min).** Use the account menu to sign in as `demo.coach` (no payments, only their teams) and
   `demo.athlete` (only their own record). "The server enforces this, not just the menu: a coach who types a payments URL
   gets refused." Every sign-in, failed sign-in, change and export is written to an audit log.
7. **Multi-tenancy (1 min, needs the Super Admin).** Sign in as the Super Admin, open **Organizations**, and show that each club
   is a separate tenant with its own plan (change it from the row menu), status, users and data. "One deployment, many clubs, none able to see another."

Have a fallback ready: the static demo (option A) on your phone works with no network dependency on your laptop.

## Questions you should expect, and honest answers

- **Is the AI real?** It is deliberately not machine learning. Scores are sums of named rules; forecasts are linear trends
  with a stated range. It is explainable, testable (the rules have unit tests) and needs no training data. Say this is
  a strength for a first product, and a learned model is a later step once there is data across many clubs.
- **Is the data real?** The demo club is synthetic. The product, security model and tests are real.
- **How is one club kept from seeing another?** Every table carries the organization; every query is filtered by it at the
  database layer and there are automated tests proving isolation (`TenantIsolationIntegrationTest`).
- **What is tested?** About 255 backend tests against a real database (including a 109-case role-and-endpoint matrix), 92
  frontend tests and an end-to-end browser test, run on every push.
- **What is not built?** Email (password reset, notifications), multi-factor authentication, payments processing (payments are
  recorded, not collected online), a native mobile app, and horizontal scaling beyond one API instance. These are on the
  roadmap, not hidden.
- **How does it make money?** Not decided in this repository. The data model already has plans (Starter, Professional,
  Enterprise) per organization; pricing is a business decision to be made with the investor.

## Before you go on

- [ ] Fresh start: `docker compose down -v && docker compose up -d --build` and confirm `docker compose ps` is healthy
- [ ] Sign in as each demo account once; keep the password somewhere you can paste from
- [ ] Browser zoom 100%, notifications off, one window; the static demo open on your phone as a backup
- [ ] Know that the Forecast and Retention pages need the data to be present; do not run with `DEMO_SEED=false`
- [ ] Never demo against a database that holds real member data
