#!/usr/bin/env bash
# Deploy the TEST ambassador portal frontend (pm2: ambassador-portal-test) from git.
#   ssh root@46.101.72.146
#   cd /var/www/ambassador-frontend-test && ./deploy-test.sh
#
# Same mechanics as deploy.sh, but targets the TEST process + TEST domain, and
# the build bakes the TEST api url via the gitignored .env.production.local.
# Refuses to run unless the .test-env marker is present (so it can never rebuild
# or restart the prod process by mistake if run in the prod checkout).
set -euo pipefail
cd "$(dirname "$0")"

# Guard: only ever run inside the dedicated TEST checkout.
if [ ! -f .test-env ]; then
  echo "[deploy-test] REFUSING: .test-env marker not found in $(pwd)." >&2
  echo "[deploy-test] Run this only in the test checkout (/var/www/ambassador-frontend-test)." >&2
  exit 1
fi

APP=ambassador-portal-test
HEALTH="https://test-ambassador.bheuni.uk/login"

PREV=$(git rev-parse HEAD)
echo "[deploy-test] $APP: at $PREV"
git diff --quiet && git diff --cached --quiet || {
  echo "[deploy-test] REFUSING: tracked files have local changes." >&2
  exit 1
}
git fetch --quiet origin develop
TARGET=${1:-$(git rev-parse origin/develop)}
if [ "$TARGET" != "$(git rev-parse origin/develop)" ]; then
  echo "[deploy-test] Skipping superseded commit $TARGET; develop has moved."
  exit 0
fi
git checkout -B develop "$TARGET"
git branch --set-upstream-to=origin/develop develop >/dev/null
NEW=$(git rev-parse HEAD)
[ "$PREV" = "$NEW" ] && echo "[deploy-test] already up to date ($NEW)"

npm ci

echo "[deploy-test] building (TEST urls baked from .env.production.local) ..."
npm run build
echo "[deploy-test] restarting $APP ..."
pm2 restart "$APP" --update-env >/dev/null

for i in $(seq 1 25); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH" || true)
  if [ "$code" = "200" ]; then
    echo "[deploy-test] OK, healthy ($code) at $NEW"
    exit 0
  fi
  sleep 1
done

echo "[deploy-test] FAIL: health check never returned 200 (last=$code). Rolling back to $PREV"
git reset --hard "$PREV"
npm run build
pm2 restart "$APP" --update-env >/dev/null
echo "[deploy-test] rolled back to $PREV"
exit 1
