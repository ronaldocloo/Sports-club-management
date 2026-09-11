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
