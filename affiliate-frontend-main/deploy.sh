#!/usr/bin/env bash
# Deploy the ambassador portal frontend (pm2: ambassador-portal) from git.
#   ssh root@46.101.72.146
#   cd /var/www/ambassador-frontend && ./deploy.sh
#
# Pulls main, reinstalls deps only if package-lock.json changed, rebuilds Next,
# restarts, and health-checks. On a failed health check it auto-rolls-back to the
# previous commit and rebuilds. The prod .env.local, node_modules/ and .next/ are
# gitignored, so they are never touched. Uses `pm2 restart` (never re-applies
# ecosystem.config.js), so the running process definition is left as-is.
set -euo pipefail
cd "$(dirname "$0")"

APP=ambassador-portal
HEALTH="https://ambassador.bheuni.uk/login"

PREV=$(git rev-parse HEAD)
echo "[deploy] $APP: at $PREV"
git fetch --quiet origin
git pull --ff-only origin main
NEW=$(git rev-parse HEAD)
[ "$PREV" = "$NEW" ] && echo "[deploy] already up to date ($NEW)"

if ! git diff --quiet "$PREV" "$NEW" -- package-lock.json; then
  echo "[deploy] package-lock.json changed -> npm ci"
  npm ci
fi

echo "[deploy] building ..."
npm run build
echo "[deploy] restarting $APP ..."
pm2 restart "$APP" --update-env >/dev/null

for i in $(seq 1 25); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH" || true)
  if [ "$code" = "200" ]; then
    echo "[deploy] OK — healthy ($code) at $NEW"
    exit 0
  fi
  sleep 1
done

echo "[deploy] FAIL — health check never returned 200 (last=$code). Rolling back to $PREV"
git reset --hard "$PREV"
npm run build
pm2 restart "$APP" --update-env >/dev/null
echo "[deploy] rolled back to $PREV"
exit 1
