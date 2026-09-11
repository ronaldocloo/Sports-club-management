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
```

Copy `.env.example` to `.env` and fill in local credentials. Never commit `.env`.

## Workflow

Branch off `main`, open a pull request. Schema changes route through the Schema Lead.

```bash
git checkout main && git pull
git checkout -b feature/phase4-ddl
git add . && git commit -m "message"
git push -u origin feature/phase4-ddl
```
