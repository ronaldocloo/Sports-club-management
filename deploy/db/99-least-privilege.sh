#!/bin/bash
# Runs once, after the schema scripts, when the database container is first created.
# The image gives the application user every privilege on its database; the app only ever needs to read and
# write rows (the schema is changed by migrations run by an administrator), so take the rest away. A stolen
# application password can then no longer drop tables or change the schema.
set -euo pipefail
mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${MARIADB_USER}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MARIADB_DATABASE}\`.* TO '${MARIADB_USER}'@'%';
FLUSH PRIVILEGES;
SQL
echo "Application user '${MARIADB_USER}' limited to SELECT, INSERT, UPDATE, DELETE."
