# Backup and Restore Runbook

## Purpose

This procedure satisfies NFR3 by proving that `sports_club` can be backed up and restored with MariaDB tools.

## Backup

Run from the XAMPP/MariaDB command line. Substitute your MariaDB username and host. Do not put a password in the command or repository; MariaDB prompts for it.

```bash
mkdir -p backups
mysqldump -u <backup_user> -p --host=localhost --single-transaction --routines --triggers --events sports_club > backups/sports_club_YYYY-MM-DD.sql
```

Record the date, command (without the password), backup filename, and file size. Keep the backup folder ignored by Git.

## Restore test

Do not overwrite the working database. Restore into a newly created `sports_club_restore_test` database:

```bash
mysql -u <restore_user> -p -e "CREATE DATABASE sports_club_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u <restore_user> -p sports_club_restore_test < backups/sports_club_YYYY-MM-DD.sql
```

If the dump contains `CREATE DATABASE sports_club` or `USE sports_club`, make a test-only copy of the dump with those statements removed before restoring; do not modify the original backup.

## Verification

Compare the source and restored database using the following queries, adjusting table names only if the schema changes:

```sql
SELECT 'athlete' AS table_name, COUNT(*) AS row_count FROM athlete
UNION ALL SELECT 'membership', COUNT(*) FROM membership
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'team', COUNT(*) FROM team
UNION ALL SELECT 'team_roster', COUNT(*) FROM team_roster;

SHOW TABLES;
SHOW TRIGGERS;
SHOW PROCEDURE STATUS WHERE Db = 'sports_club_restore_test';
SHOW FUNCTION STATUS WHERE Db = 'sports_club_restore_test';
```

Save the source and restored results. A successful restore has identical counts and includes the expected tables, triggers, and routines.

## Submission evidence

- Backup file name and size.
- Successful restore command/output.
- Source and restored row-count results.
- Output of `SHOW TRIGGERS` and routine checks.
- One sentence confirming whether the verification matched.
