#!/usr/bin/env bash
# Creates (or recreates) the throwaway database used by the backend integration tests, from the
# schema scripts. It never touches the development database.
#
#   scripts/setup-test-db.sh            # uses the current OS user's MariaDB access
#   DB_ADMIN_ARGS="-uroot -p" scripts/setup-test-db.sh
#
# The tests connect as DB_USER / DB_PASSWORD (default sportsteam / sportsteam), so this script also
# grants that account access to the test database only.
set -euo pipefail

cd "$(dirname "$0")/.."
DB_TEST_NAME="${DB_TEST_NAME:-sports_club_test}"
DB_USER="${DB_USER:-sportsteam}"
DB_PASSWORD="${DB_PASSWORD:-sportsteam}"
ADMIN="${DB_ADMIN_ARGS:-}"
GRANT_HOST="${DB_GRANT_HOST:-localhost}"   # CI uses % because the database runs in a container

mariadb $ADMIN -e "DROP DATABASE IF EXISTS \`$DB_TEST_NAME\`; CREATE DATABASE \`$DB_TEST_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb $ADMIN -e "CREATE USER IF NOT EXISTS '$DB_USER'@'$GRANT_HOST' IDENTIFIED BY '$DB_PASSWORD'; GRANT ALL PRIVILEGES ON \`$DB_TEST_NAME\`.* TO '$DB_USER'@'$GRANT_HOST'; FLUSH PRIVILEGES;"

# Tables and later migrations only: no seed data, and no triggers (the services enforce the same rules).
for f in schema/02_tables.sql schema/03_indexes.sql schema/04_phase3_auth.sql schema/05_phase4_platform.sql schema/06_phase5_reporting.sql schema/07_phase7_security.sql; do
  echo "  loading $f"
  mariadb $ADMIN "$DB_TEST_NAME" < "$f"
done
echo "Test database '$DB_TEST_NAME' is ready."
