# Phase 3 — Logical Design & Normalization
## Sports Club Management System

Schema Lead: David Acheampong Awuah
Target DBMS: MariaDB 10.x (XAMPP)

This document converts the Phase 2 ER model into a normalized relational schema. Phase 4 DDL is written directly from the tables below.

Every table is in **3NF**. Deviations, and the reasoning behind them, are noted explicitly.

---

## 0. Changes from the Phase 2 Model

Four changes were made during the conceptual-to-logical translation. These are worth presenting, because they show analysis rather than transcription.

| # | Change | Reason |
|---|---|---|
| C1 | `ATHLETE.name` split into `first_name` / `last_name`; `contact` split into `email` / `phone` | 1NF — attributes must be atomic. Also required for FR8 (search by name). |
| C2 | `MEMBERSHIP.type` extracted into a `MEMBERSHIP_TYPE` table | 3NF — `fee` depends on `type`, not on `membership_id`. Transitive dependency removed. |
| C3 | `MEMBERSHIP.amount_charged` added | Point-in-time price snapshot. Not a duplicate of `MEMBERSHIP_TYPE.fee` — protects historical revenue reports from later price changes. |
| C4 | M:N relationships R4 and R5 resolved into `TEAM_ROSTER` and `TEAM_COMPETITION` | Relational model cannot represent M:N directly. Flagged in Phase 2 §2.3. |

### The C2 decomposition, stated formally

Phase 2 model, had fee been included:

```
MEMBERSHIP(membership_id, athlete_id, type, fee, start_date, end_date, status)
```

Functional dependencies:

```
membership_id → athlete_id, type, start_date, end_date, status
type          → fee
```

`fee` is determined by `type`, which is a non-key attribute. Therefore:

```
membership_id → type → fee
```

This is a **transitive dependency**, violating 3NF. Consequences:

- **Update anomaly** — changing the Junior fee requires updating every Junior membership row.
- **Insertion anomaly** — a new membership type cannot be recorded until someone buys one.
- **Deletion anomaly** — deleting the last Premium membership erases the fact that Premium costs 800.

Decomposition into `MEMBERSHIP_TYPE(type_id, type_name, fee, duration_months)` and `MEMBERSHIP(..., type_id, ...)` removes the dependency. The decomposition is lossless (join on `type_id` reconstructs the original) and dependency-preserving.

---

## 1. Table Definitions

### 1.1 MEMBERSHIP_TYPE

Lookup table. No dependencies — created first.

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `type_id` | INT | PK | AUTO_INCREMENT |
| `type_name` | VARCHAR(50) | | NOT NULL, UNIQUE |
| `fee` | DECIMAL(10,2) | | NOT NULL, CHECK (fee >= 0) |
| `duration_months` | INT | | NOT NULL, CHECK (duration_months > 0) |
| `description` | VARCHAR(255) | | NULL |

Expected rows: Junior, Senior, Student, Premium, Family.

`DECIMAL(10,2)` not `FLOAT` — floating point cannot represent currency exactly, and this table feeds revenue reporting (FR9).

---

### 1.2 ATHLETE

**Settled.**

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `athlete_id` | INT | PK | AUTO_INCREMENT |
| `first_name` | VARCHAR(50) | | NOT NULL |
| `last_name` | VARCHAR(50) | | NOT NULL |
| `date_of_birth` | DATE | | NOT NULL |
| `gender` | ENUM('Male','Female','Other') | | NOT NULL |
| `email` | VARCHAR(100) | | NULL |
| `phone` | VARCHAR(20) | | NOT NULL |
| `join_date` | DATE | | NOT NULL, DEFAULT CURRENT_DATE |

`email` deliberately not UNIQUE — junior athletes commonly share a parent's address.

Index on `last_name` for FR8.

---

### 1.3 MEMBERSHIP

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `membership_id` | INT | PK | AUTO_INCREMENT |
| `athlete_id` | INT | FK → ATHLETE | NOT NULL |
| `type_id` | INT | FK → MEMBERSHIP_TYPE | NOT NULL |
| `start_date` | DATE | | NOT NULL |
| `end_date` | DATE | | NOT NULL |
| `amount_charged` | DECIMAL(10,2) | | NOT NULL, CHECK (amount_charged >= 0) |
| `status` | ENUM('Active','Expired','Suspended') | | NOT NULL, DEFAULT 'Active' |

Table constraint: `CHECK (end_date > start_date)`

Business rules covered:
- **BR2** (status always one of three values) — enforced by the ENUM + NOT NULL. Structurally impossible to violate.
- Assumption 1.4 (renewals create new rows) — supported by 1:M from ATHLETE.

**Not enforceable by constraint:** preventing two simultaneously Active memberships for one athlete. A UNIQUE index cannot express "only one row per athlete where status = 'Active'". This requires a **trigger** — assign to Samira/Ronald in Phase 6b.

---

### 1.4 PAYMENT

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `payment_id` | INT | PK | AUTO_INCREMENT |
| `membership_id` | INT | FK → MEMBERSHIP | NOT NULL |
| `amount` | DECIMAL(10,2) | | NOT NULL, CHECK (amount > 0) |
| `payment_date` | DATE *or* DATETIME | | NOT NULL — see **D6** |
| `method` | ENUM('Cash','Card','Bank Transfer','Mobile Money') | | NOT NULL |
| `status` | ENUM('Pending','Completed','Failed','Refunded') | | NOT NULL, DEFAULT 'Pending' |
| `reference_no` | VARCHAR(50) | | NULL, UNIQUE |

**BR3** (payment linked to exactly one membership) — enforced by `NOT NULL` FK. The NOT NULL is the part that does the work; without it, orphan payments are legal.

`reference_no` holds the Mobile Money / bank transaction ID. Nullable because cash payments have none; UNIQUE because a transaction ID must not be recorded twice.

---

### 1.5 COACH

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `coach_id` | INT | PK | AUTO_INCREMENT |
| `first_name` | VARCHAR(50) | | NOT NULL |
| `last_name` | VARCHAR(50) | | NOT NULL |
| `specialty` | VARCHAR(50) | | NOT NULL |
| `email` | VARCHAR(100) | | NOT NULL, UNIQUE |
| `phone` | VARCHAR(20) | | NOT NULL |
| `hire_date` | DATE | | NOT NULL |

Coach email *is* UNIQUE — staff records, one address each, and it becomes the login identifier if D1 is adopted.

---

### 1.6 TEAM

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `team_id` | INT | PK | AUTO_INCREMENT |
| `team_name` | VARCHAR(100) | | NOT NULL, UNIQUE |
| `sport` | see **D2** | | NOT NULL |
| `coach_id` | INT | FK → COACH | NOT NULL |
| `founded_date` | DATE | | NULL |

**BR4** (exactly one coach per team, coach may lead many) — enforced by a single `NOT NULL` FK column. A nullable FK would allow uncoached teams; a junction table would allow multiple coaches. The design *is* the constraint here.

---

### 1.7 COMPETITION

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `competition_id` | INT | PK | AUTO_INCREMENT |
| `comp_name` | VARCHAR(100) | | NOT NULL |
| `comp_date` | DATE | | NOT NULL |
| `venue` | see **D7** | | |
| `level` | ENUM('Local','Regional','National','International') | | NOT NULL |
| `registration_deadline` | DATE | | NULL |

Index on `comp_date` — FR8 filters by competition date, FR9 reports upcoming competitions.

---

### 1.8 FACILITY

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `facility_id` | INT | PK | AUTO_INCREMENT |
| `facility_name` | VARCHAR(100) | | NOT NULL, UNIQUE |
| `facility_type` | ENUM('Court','Field','Pool','Gym','Track','Hall') | | NOT NULL |
| `capacity` | INT | | NOT NULL, CHECK (capacity > 0) |
| `location` | VARCHAR(100) | | NULL |
| `status` | ENUM('Available','Maintenance','Closed') | | NOT NULL, DEFAULT 'Available' |

`status` is an addition — a facility under maintenance must be bookable-blocked without deleting its booking history.

---

### 1.9 FACILITY_BOOKING

The most consequential table in the schema. **BR5** (no double-booking) lives or dies here. See **D3**.

Attributes common to both options:

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `booking_id` | INT | PK | AUTO_INCREMENT |
| `facility_id` | INT | FK → FACILITY | NOT NULL |
| `team_id` | INT | FK → TEAM | NOT NULL |
| `booking_date` | DATE | | NOT NULL |
| `purpose` | VARCHAR(100) | | NULL |
| `status` | ENUM('Confirmed','Cancelled') | | NOT NULL, DEFAULT 'Confirmed' |
| `created_at` | TIMESTAMP | | DEFAULT CURRENT_TIMESTAMP |

The time representation is decided in **D3**.

---

### 1.10 TEAM_ROSTER

Resolves R4 (ATHLETE ↔ TEAM, M:N).

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `team_id` | INT | PK, FK → TEAM | |
| `athlete_id` | INT | PK, FK → ATHLETE | |
| `date_joined` | DATE | | NOT NULL, DEFAULT CURRENT_DATE |
| `position` | VARCHAR(50) | | NULL |
| `is_active` | BOOLEAN | | NOT NULL, DEFAULT TRUE |

Composite PK `(team_id, athlete_id)` — see **D4**. This automatically prevents the same athlete being added to the same team twice.

**BR1** (athlete must hold a membership before joining a team) is **not enforceable by a foreign key** — it is a conditional existence rule across two tables. Requires a BEFORE INSERT trigger. Assign to Phase 6b.

---

### 1.11 TEAM_COMPETITION

Resolves R5 (TEAM ↔ COMPETITION, M:N). Satisfies **BR6**.

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `team_id` | INT | PK, FK → TEAM | |
| `competition_id` | INT | PK, FK → COMPETITION | |
| `registration_date` | DATE | | NOT NULL, DEFAULT CURRENT_DATE |
| `final_position` | INT | | NULL, CHECK (final_position > 0) |
| `points_scored` | INT | | NULL, CHECK (points_scored >= 0) |

`final_position` and `points_scored` are nullable — unknown until the competition is played. This is exactly why junction tables are worth having even when you think you only need the link: they carry relationship attributes that belong to neither parent.

---

### 1.12 APP_USER — proposed, see **D1**

| Attribute | Type | Key | Constraints |
|---|---|---|---|
| `user_id` | INT | PK | AUTO_INCREMENT |
| `username` | VARCHAR(50) | | NOT NULL, UNIQUE |
| `password_hash` | VARCHAR(255) | | NOT NULL |
| `role` | ENUM('Admin','Coach','FrontDesk') | | NOT NULL |
| `coach_id` | INT | FK → COACH | NULL |
| `is_active` | BOOLEAN | | NOT NULL, DEFAULT TRUE |
| `last_login` | DATETIME | | NULL |

Directly satisfies **NFR2** (hashed passwords) and **FR10** (role-based access). Without it, neither requirement has anywhere to live in the schema.

`VARCHAR(255)` because bcrypt outputs 60 characters and Argon2 runs longer — sizing to the current algorithm is a mistake people only make once.

`coach_id` nullable: admin and front-desk users are not coaches. When populated, it lets the app scope a coach's view to their own teams.

---

## 2. Open Decisions

Eight items. Answer all and the DDL can be written in one go.

---

### D1 — Add the APP_USER table?

FR10 requires role-based access. NFR2 requires hashed passwords. Nothing in the Phase 2 model stores either.

Phase 7 (`CREATE ROLE` / `GRANT`) secures the *database*, controlling what a connected DB user may touch. It does not log a front-desk clerk into the application. These are different layers and the project asks for both.

- **Yes** → 12 tables. Both requirements traceable to a table. App login works.
- **No** → 11 tables. FR10 and NFR2 have no schema support; the app fakes login or hardcodes users.

**RESOLVED: Yes.** Requirements traceability is graded, and an unimplementable requirement is a visible gap.

---

### D2 — How to store `TEAM.sport`

**NFR5** states the schema must support *"multiple sports without redesign."* That phrasing points at the answer.

| Option | Adding a new sport requires | Table count |
|---|---|---|
| `VARCHAR(50)` | Nothing — but typos multiply ("Football", "football", "Fooball") and break GROUP BY reports |
| `ENUM(...)` | `ALTER TABLE` — schema change, i.e. redesign | unchanged |
| `SPORT` lookup table | One `INSERT` | +1 |

Note this is **not** a normalization question. Nothing depends on `sport`, so storing it as text is not a transitive dependency. It is a data-quality and extensibility question — worth stating that distinction in the write-up, since it shows you know *why* you normalize rather than reflexively splitting every column out.

**RESOLVED: SPORT lookup table**, on the strength of NFR5.

---

### D3 — Time model for FACILITY_BOOKING

**Option 1 — fixed slots.** `time_slot ENUM('06:00-08:00','08:00-10:00', ...)` plus:

```sql
CONSTRAINT uq_facility_slot UNIQUE (facility_id, booking_date, time_slot)
```

BR5 becomes structurally unviolatable. The DBMS rejects the second booking with no code involved. Satisfies **NFR6** (integrity enforced at database level, not application logic) in the strongest possible way.

Limitation: bookings only in predefined blocks.

**Option 2 — free times.** `start_time TIME`, `end_time TIME`. Realistic, but overlap is not a uniqueness problem — 09:00-11:00 and 10:00-12:00 conflict while being distinct values. UNIQUE cannot catch it. Requires a BEFORE INSERT/UPDATE trigger doing `NEW.start_time < existing.end_time AND NEW.end_time > existing.start_time`, and the trigger must also fire on UPDATE or it is trivially bypassed.

**RESOLVED: Option 1** (fixed time slots). On a five-day build, the business rule you can prove is worth more than the one you can demo. Samira and Ronald still have BR1 and the single-active-membership rule to write triggers for, so Phase 6b is not short of work.

---

### D4 — Junction table primary keys

- **Composite PK** `(team_id, athlete_id)` — textbook, self-enforcing against duplicates, no surrogate column.
- **Surrogate PK** `roster_id` + UNIQUE `(team_id, athlete_id)` — easier for ORMs; some app frameworks handle composite keys poorly.

One caveat on composite: an athlete who leaves a team and rejoins cannot be re-inserted as a second row. The `is_active` flag handles this by toggling instead of re-inserting, which is arguably the better data model anyway.

**RESOLVED: Composite PK.**

---

### D5 — Referential actions on delete

The default is `RESTRICT` — MariaDB refuses to delete a parent with children. Blanket-CASCADE is dangerous: deleting one athlete would silently erase their memberships *and* the payment records attached to them.

Proposed per-FK policy:

| Foreign key | ON DELETE | Reasoning |
|---|---|---|
| MEMBERSHIP → ATHLETE | RESTRICT | Never lose financial history via an athlete deletion |
| MEMBERSHIP → MEMBERSHIP_TYPE | RESTRICT | A type in use cannot be removed |
| PAYMENT → MEMBERSHIP | RESTRICT | Financial records are audit data |
| TEAM → COACH | RESTRICT | Forces explicit reassignment before a coach is removed |
| TEAM → SPORT | RESTRICT | (if D2 = lookup table) |
| FACILITY_BOOKING → FACILITY | RESTRICT | Booking history survives facility removal |
| FACILITY_BOOKING → TEAM | RESTRICT | Per the Phase 3 report (§3, §5): CASCADE is reserved for the two weak entities (TEAM_ROSTER, TEAM_COMPETITION) only. FACILITY_BOOKING has its own surrogate `booking_id`, making it a strong entity, so its FKs follow the RESTRICT-on-historical-data rule like FACILITY_BOOKING → FACILITY above. A team with booking rows must have those bookings reassigned or removed before it can be deleted. |
| TEAM_ROSTER → TEAM / ATHLETE | CASCADE | Junction rows are meaningless without both parents |
| TEAM_COMPETITION → TEAM / COMPETITION | CASCADE | Same |
| APP_USER → COACH | SET NULL | Deleting a coach record should not delete the login |

All `ON UPDATE CASCADE`, since surrogate keys should never change anyway.

**RESOLVED: adopt as listed**, with FACILITY_BOOKING → TEAM corrected to RESTRICT per the Phase 3 report — CASCADE is reserved for the two weak entities (TEAM_ROSTER, TEAM_COMPETITION) only.

---

### D6 — `PAYMENT.payment_date`: DATE or DATETIME?

DATE is simpler and enough for daily/monthly revenue reports. DATETIME captures time of day, which matters for same-day reconciliation and for ordering multiple payments on one date.

**RESOLVED: DATETIME.** Aggregating a DATETIME down to a date is trivial; recovering a lost time is not.

---

### D7 — `COMPETITION.venue`: free text or FK to FACILITY?

Competitions are frequently held at other clubs' grounds, which are not rows in your FACILITY table. A mandatory FK would make away fixtures unrecordable.

Options: `VARCHAR(100)` free text; or `facility_id` nullable FK **plus** `external_venue VARCHAR(100)` for away events.

**RESOLVED: `VARCHAR(100)` free text.** The hybrid is more correct but adds a join and a CHECK constraint for one field, and your scope statement excludes multi-club support anyway.

---

### D8 — Surrogate keys throughout?

Every table above uses `INT AUTO_INCREMENT`. The alternative is meaningful codes (`ATH001`, `TM007`).

Surrogates are stable, compact, index efficiently, and never need to change when business meaning shifts. Meaningful codes read better in a demo but tend to acquire embedded logic and eventually break.

Compromise if the display format matters: keep the INT PK, add a generated or application-formatted `athlete_code` for the UI.

**RESOLVED: surrogate INT PKs**, with a display code only if the team wants one.

---

## 3. Table Creation Order

Foreign keys require the referenced table to exist. This is the order for `schema/02_tables.sql`:

```
1.  MEMBERSHIP_TYPE      (no dependencies)
2.  SPORT                (no dependencies — if D2 = lookup)
3.  ATHLETE              (no dependencies)
4.  COACH                (no dependencies)
5.  FACILITY             (no dependencies)
6.  COMPETITION          (no dependencies)
7.  MEMBERSHIP           → ATHLETE, MEMBERSHIP_TYPE
8.  TEAM                 → COACH, SPORT
9.  APP_USER             → COACH            (if D1 = yes)
10. PAYMENT              → MEMBERSHIP
11. FACILITY_BOOKING     → FACILITY, TEAM
12. TEAM_ROSTER          → TEAM, ATHLETE
13. TEAM_COMPETITION     → TEAM, COMPETITION
```

Richard's seed data (Phase 5) must follow the same order.

---

## 4. Planned Indexes

Primary and unique keys are indexed automatically. These are the additions, each tied to a stated requirement:

| Index | Table | Column(s) | Requirement |
|---|---|---|---|
| `idx_athlete_lastname` | ATHLETE | `last_name` | FR8 — search by athlete name |
| `idx_membership_status` | MEMBERSHIP | `status` | FR9 — active members report |
| `idx_membership_athlete` | MEMBERSHIP | `athlete_id` | Join performance |
| `idx_membership_dates` | MEMBERSHIP | `start_date, end_date` | Expiry and renewal queries |
| `idx_payment_date` | PAYMENT | `payment_date` | FR9 — revenue by period |
| `idx_payment_status` | PAYMENT | `status` | Outstanding payments report |
| `idx_competition_date` | COMPETITION | `comp_date` | FR8/FR9 — upcoming competitions |
| `idx_booking_lookup` | FACILITY_BOOKING | `facility_id, booking_date` | FR7 — conflict checking |

`idx_booking_lookup` is the one that matters for **NFR1** (sub-2-second responses): every booking attempt scans for conflicts on that exact column pair.

---

## 5. Business Rule Coverage

| Rule | Mechanism | Owner |
|---|---|---|
| BR1 — membership required before team assignment | **Trigger** (not expressible as FK) | Phase 6b |
| BR2 — membership status always one of three | ENUM + NOT NULL | Phase 4 |
| BR3 — payment linked to exactly one membership | NOT NULL FK | Phase 4 |
| BR4 — team has exactly one coach | NOT NULL FK on TEAM | Phase 4 |
| BR5 — no facility double-booking | UNIQUE constraint (D3 Opt 1) or trigger (D3 Opt 2) | Phase 4 or 6b |
| BR6 — M:N teams and competitions | TEAM_COMPETITION junction | Phase 4 |
| BR7 — only staff/admin modify payments and status | GRANT privileges + APP_USER role check | Phase 7 / 8 |

Three of seven rules are enforced by structure alone. That ratio is the argument for the design — the more rules the schema makes impossible, the fewer the application can get wrong.

---

## 6. Deliverables Checklist

- [x] D1–D8 resolved
- [ ] ER diagram updated to reflect C1–C4 (Phase 2 diagram is now out of date)
- [ ] Data dictionary — this document, once decisions are filled in
- [ ] Normalization narrative — §0, the 1NF and 3NF arguments
- [ ] `schema/01_create_database.sql`
- [x] `schema/02_tables.sql`
- [ ] `schema/03_indexes.sql`
- [ ] Tag `v1-schema-locked` after merge
