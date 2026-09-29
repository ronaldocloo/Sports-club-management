# Password Hashing and Application RBAC

## Password storage

Passwords are never stored in plaintext. On user creation or password change, the application hashes the password with **Argon2id** (bcrypt is an acceptable fallback) and stores only the result in `app_user.password_hash`.

The `VARCHAR(255)` field is sufficient for standard Argon2id or bcrypt encoded hashes. The hash contains its algorithm and salt parameters, so a separate salt column is unnecessary. On login, the application retrieves the stored hash and verifies the supplied password using the library’s secure verification function. It does not compare plaintext strings.

The application must:

- Use a maintained Argon2id/bcrypt library; never write custom cryptography.
- Use parameterized SQL queries.
- Reject login when `app_user.is_active = FALSE`.
- Update `app_user.last_login` only after successful authentication.
- Keep database credentials and any password-related configuration in `.env`, never in Git.

## Application role-based access

The `app_user` table has three roles:

| Application role | Access in the application |
|---|---|
| `Admin` | Full administrative screens and reports |
| `FrontDesk` | Athlete, membership, and payment screens |
| `Coach` | Read-only roster screens for the coach’s assigned team(s) |

For a logged-in coach, the application reads `app_user.coach_id` and filters the roster query through:

```text
app_user.coach_id -> team.coach_id -> team_roster.team_id -> athlete
```

Example query shape (use a prepared statement, never string concatenation):

```sql
SELECT t.team_name, a.athlete_id, a.first_name, a.last_name,
       tr.position, tr.date_joined, tr.is_active
FROM team AS t
JOIN team_roster AS tr ON tr.team_id = t.team_id
JOIN athlete AS a ON a.athlete_id = tr.athlete_id
WHERE t.coach_id = ?
  AND tr.is_active = TRUE;
```

The `?` is the authenticated user’s `coach_id`, obtained from the server-side session rather than the browser request. Database roles restrict which tables a connection can access; this application filter restricts which rows an individual coach can see.

## BR7 coverage

BR7 requires that only staff and administrators modify payment and membership status. The database grants give `front_desk` the ability to record a payment and manage membership records, while `admin` retains full access. `coach` receives no write permissions and no financial-table access. A front-desk account has no direct `UPDATE` on `payment`, so it cannot alter a completed payment. Application role checks must mirror this before rendering forms or accepting requests.


## Phase 3 additions: sessions, roles and data scoping

Apply `schema/04_phase3_auth.sql` (adds the `Athlete` role and `app_user.athlete_id`). It is additive and safe to re-run.

### Roles

| Role | Sees | Can change |
|---|---|---|
| `Admin` | Everything | Everything, including users |
| `FrontDesk` | Athletes, memberships, payments, bookings, competitions | Athletes, memberships; new payments only |
| `Coach` | Only the teams they coach (`app_user.coach_id`) and the athletes on those teams | Nothing |
| `Athlete` | Only their own athlete record (`app_user.athlete_id`), memberships, payments and teams | Their own password |

Coach and Athlete scoping is enforced by the API (`AccessScope`), not just hidden in the UI: list endpoints return
only visible rows and single-record requests for anything else return 403.

### Sessions

- Cookie-based server sessions: `HttpOnly`, `SameSite=Lax`, 30 minutes of inactivity.
- A new session id is issued on login (prevents session fixation).
- Unauthenticated or expired requests get **401** (the frontend then returns the user to the login page).
- `ActiveUserFilter` re-checks the account on every request. Deactivating a user, deleting them, or changing their role
  ends their open session immediately.

### Account management rules

- Passwords are bcrypt-hashed. Users change their own password with `POST /api/auth/change-password`
  (current password required). Admins can reset a password by sending `password` on `PUT /api/users/{id}`; omit it to keep the current one.
- An Admin cannot deactivate, delete, or change the role of their own account, and the last active Admin cannot be removed.
- Usernames are unique; Coach and Athlete accounts must be linked to a coach/athlete record.


## Phase 4 additions: multi-organization isolation and audit

Apply `schema/05_phase4_platform.sql`.

### Tenant isolation

- Every data table carries `organization_id` (NOT NULL, no default). New rows are stamped with the caller's
  organization automatically; nothing can be saved without an owner.
- The API enables a Hibernate `tenant` filter for each request, so list queries only return the caller's rows.
  Lookups by primary key (which filters do not cover) go through `TenantJpaRepository`, which hides other
  organizations' rows, so a guessed id returns 404.
- Creating a record that references another organization's data (for example a team using another organization's
  sport) fails, because those ids do not exist from the caller's point of view.
- Names that used to be globally unique (team, sport, facility, coach email, membership type, payment reference) are
  now unique per organization. Usernames stay globally unique so sign-in works.
- A **Super Admin** has no organization. With no `X-Organization-Id` header they see no tenant data and cannot write to
  it; with the header set to an existing organization they act as an Admin inside it. Only a Super Admin can create
  organizations or other Super Admins.
- Suspending an organization ends its users' sessions and blocks sign-in.

### Audit log

`audit_log` records sign-ins (and failures), sign-outs, password changes and every successful create, update and
delete through the API: who, what, which record, when. Admins read their own organization's entries at
`GET /api/audit-logs`. Auditing never blocks the action being audited.

### Business rules enforced by the API

- A completed payment can only be refunded, never edited or reverted; a refunded payment is final; completing a
  payment cannot exceed the membership amount charged.
- Teams cannot register after a competition's registration deadline; bookings cannot be in the past or on a facility
  that is not available.
- Fixtures need two different teams registered in the competition; a coach can record results only for their own teams.
- Attendance can only be marked for athletes on the team's active roster.
