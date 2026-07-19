#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE=(docker compose --project-name taskflow-e2e --file "$ROOT/docker-compose.e2e.yml")
CONNECTION_STRING='Host=localhost;Port=55432;Database=taskflow_e2e;Username=taskflow_e2e;Password=taskflow_e2e_pwd'

cleanup() {
  "${COMPOSE[@]}" down --volumes --remove-orphans
}

show_logs() {
  "${COMPOSE[@]}" logs
}

trap cleanup EXIT

"${COMPOSE[@]}" up --detach

for _ in {1..60}; do
  if "${COMPOSE[@]}" exec --no-TTY postgres-e2e \
    pg_isready --username taskflow_e2e --dbname taskflow_e2e >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! "${COMPOSE[@]}" exec --no-TTY postgres-e2e \
  pg_isready --username taskflow_e2e --dbname taskflow_e2e >/dev/null 2>&1; then
  show_logs
  exit 1
fi

for _ in {1..90}; do
  if node -e \
    "fetch('http://localhost:18080/realms/taskflow/.well-known/openid-configuration').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; then
    break
  fi
  sleep 2
done

if ! node -e \
  "fetch('http://localhost:18080/realms/taskflow/.well-known/openid-configuration').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"; then
  show_logs
  exit 1
fi

dotnet ef database update \
  --project "$ROOT/backend/src/TaskFlow.Infrastructure" \
  --connection "$CONNECTION_STRING"

pnpm --dir "$ROOT/frontend" exec playwright test "$@"
