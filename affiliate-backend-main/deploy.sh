#!/usr/bin/env bash
# Deploy the ambassador portal API (pm2: ambassador-api) from git.
#   ssh root@46.101.72.146
#   cd /var/www/ambassador-backend && ./deploy.sh
#
# Pulls main, reinstalls deps only if requirements.txt changed, restarts, and
# health-checks. On a failed health check it auto-rolls-back to the previous commit.
# The prod .env, venv/ and affiliate.db are gitignored, so they are never touched.
set -euo pipefail
cd "$(dirname "$0")"

APP=ambassador-api
HEALTH="https://affiliate.bheuni.uk/public/payout-policy"

PREV=$(git rev-parse HEAD)
echo "[deploy] $APP: at $PREV"
git fetch --quiet origin
git pull --ff-only origin main
NEW=$(git rev-parse HEAD)
[ "$PREV" = "$NEW" ] && echo "[deploy] already up to date ($NEW)"

if ! git diff --quiet "$PREV" "$NEW" -- requirements.txt; then
  echo "[deploy] requirements.txt changed -> pip install"
  venv/bin/pip install -q -r requirements.txt
fi

echo "[deploy] restarting $APP ..."
pm2 restart "$APP" --update-env >/dev/null

for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH" || true)
  if [ "$code" = "200" ]; then
    echo "[deploy] OK — healthy ($code) at $NEW"
    exit 0
  fi
  sleep 1
done

echo "[deploy] FAIL — health check never returned 200 (last=$code). Rolling back to $PREV"
git reset --hard "$PREV"
pm2 restart "$APP" --update-env >/dev/null
echo "[deploy] rolled back to $PREV"
exit 1
