#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../quantifex/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

cd "$SCRIPT_DIR/.."

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "${POSTGRES_HOST:-localhost}" \
  -p "${POSTGRES_PORT:-5432}" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -f "$SCRIPT_DIR/seed_db.sql"

echo "Database seeded successfully."
