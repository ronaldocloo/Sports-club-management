# Deployment

The platform is three containers: **MariaDB**, the **Spring Boot API** and an **nginx web tier** that serves the React app
and forwards `/api` to the API. Only the web tier is published; the API and database are reachable inside the Docker
network only. The browser talks to a single origin, so the session cookie is first-party and CORS is not needed.

```
browser ──► web (nginx :8088) ──/api──► backend (:8080) ──► db (MariaDB)
```

## Quick start (any machine with Docker)

```bash
cp deploy/.env.example .env      # then edit .env: set DB_ROOT_PASSWORD, DB_PASSWORD, SUPERADMIN_PASSWORD
docker compose up -d --build
docker compose ps                # wait until db, backend and web are healthy
```

Open `http://localhost:8088` and sign in as the Super Admin you configured. To try it over plain `http://localhost`
(no HTTPS), set `COOKIE_SECURE=false` in `.env`; never do that on a real server.

The first start creates the database from `schema/02` to `09`, limits the application's database account to
`SELECT/INSERT/UPDATE/DELETE` (`deploy/db/99-least-privilege.sh`), and creates the Super Admin if none exists. After that
first start, clear `SUPERADMIN_PASSWORD` in `.env`; it is ignored once a Super Admin exists.

> Status: these container files are written and reviewed but have not been built on the author's machine, which has no
> Docker. The CI `stack` job builds them and smoke-tests the whole stack on every push; check that it is green before
> relying on them.

## Configuration

Everything is an environment variable (set in `.env`, read by `docker-compose.yml`).

| Variable | Purpose | Default |
|---|---|---|
| `DB_ROOT_PASSWORD`, `DB_PASSWORD` | database passwords (required) | none |
| `DB_NAME`, `DB_USER` | database and application account | `sports_club`, `sportsapp` |
| `WEB_PORT` | published port | `8088` |
| `COOKIE_SECURE` | mark the session cookie Secure (needs HTTPS) | `true` |
| `SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD` | first platform administrator | `superadmin`, empty (skipped) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP server for password-reset email (optional) | empty (email off) |
| `MAIL_AUTH`, `MAIL_STARTTLS` | set `false` for a relay that needs no login / has no TLS | `true` |
| `PUBLIC_URL` | the address people open the site at; reset links point here | `http://localhost:8088` |
| `DEMO_SEED`, `DEMO_PASSWORD` | create the demo organization (see `docs/DEMO.md`) | `false`, random |

The `prod` Spring profile is always on in the containers: no default credentials (the app will not start without them),
Secure and SameSite=Strict cookies, no error text in responses. The API's own settings live in
`app/backend/src/main/resources/application*.properties`.

## HTTPS (required for real use)

Terminate TLS in front of the `web` container with anything you trust: a cloud load balancer, Caddy, Traefik, or nginx on
the host. It only has to forward to port 8088 and pass `X-Forwarded-For` and `X-Forwarded-Proto`. With Caddy the whole
config is:

```
sports.example.com {
    reverse_proxy localhost:8088
}
```

Caddy obtains and renews the certificate automatically. Keep `COOKIE_SECURE=true`.

## Operating it

- **Health:** `GET /actuator/health` (also `/liveness` and `/readiness`) on the API, used by the compose health checks.
  Nothing else from Actuator is exposed and it shows no internal detail.
- **Logs:** `docker compose logs -f backend`. Every state change and every export is also in the audit log inside the app.
- **Updating:** `git pull && docker compose up -d --build`. Sessions are stored in the database, so people stay signed in across a restart.
- **Upgrading an existing database** from before schema 08/09: apply `schema/08_sessions.sql` and `schema/09_accounts.sql` (both safe to re-run) before starting the new version.
- **Schema changes:** new migrations are additive `schema/NN_*.sql` files, re-runnable. Apply one to a running database:
  `docker compose exec -T db sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' < schema/08_example.sql`.
  Take a backup first. The container's init scripts only run when the data volume is first created.
- **Backups:** `docker compose exec -T db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --single-transaction "$MARIADB_DATABASE"' | gzip > backup-$(date +%F).sql.gz`
  Run it on a schedule, copy the file off the machine, and test a restore now and then. The full runbook is
  `security/03_backup_restore_runbook.md`.
- **Reset the demo:** `docker compose down -v` deletes the database volume (and everything in it), then `up` again.

## Production checklist

- [ ] HTTPS in front, `COOKIE_SECURE=true`
- [ ] Strong random `DB_ROOT_PASSWORD` and `DB_PASSWORD`, `.env` not committed
- [ ] `SUPERADMIN_PASSWORD` cleared after the first start; Super Admin password stored in a password manager
- [ ] `DEMO_SEED=false` on anything holding real data
- [ ] Database backups scheduled, copied off-site, restore tested
- [ ] Only the web port is reachable from outside (firewall)
- [ ] Deal with the empty organization the schema creates as id 1 ("Ashesi Sports Club", left over from the project's
      original single-club design): suspend it in the Organizations page as Super Admin, or rename it with
      `UPDATE organization SET name = 'Your Club', slug = 'your-club' WHERE organization_id = 1;`

## Email, sessions and sign-in security

- **Password reset by email** is offered only when `MAIL_HOST`, `MAIL_FROM` and `PUBLIC_URL` are set. Otherwise the "Forgot
  password" dialog tells people to ask an administrator, so nothing pretends to work. Links work once and expire after an
  hour; only a hash of each token is stored. People add their address in Settings, or an admin adds it when creating the user.
- **Two-step sign-in** (any authenticator app) is optional per user, in Settings. An admin can switch it off for someone who
  lost their phone (Users, row menu). Ten one-time recovery codes are given at set-up.
- **Sessions** live in the database (`SPRING_SESSION*` tables), so more than one API container can run behind a load balancer
  and a restart does not sign anyone out. Changing someone's password (admin or reset link) signs them out everywhere.

## Known limits

- **Rate limiting is per API instance.** With several instances the effective limit is multiplied by the count. Account
  lockout (5 failures, 15 minutes) is stored in the database and is shared. Put a limit at your load balancer too.
- **The 06:00 daily job runs on every instance.** It is safe to run twice (alerts are de-duplicated, expiry is idempotent)
  but wasteful; run one instance for it if that matters.
- **No automatic backups or monitoring** are included; use your host's tools.
- **Two-step sign-in is optional, not enforced.** There is no policy yet to require it for Admins.
- **Notifications are in-app only** (the bell); they cannot be switched off individually and are not emailed.
- Java 21 is used in the images (the project targets Java 17 and is tested on 21 in CI).
