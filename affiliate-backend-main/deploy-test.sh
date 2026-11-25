#!/usr/bin/env bash
# Deploy the TEST ambassador portal API (pm2: ambassador-api-test) from git.
#   ssh root@46.101.72.146
#   cd /var/www/ambassador-backend-test && ./deploy-test.sh
#
# Same mechanics as deploy.sh, but targets the TEST process + TEST domain, and
# refuses to run unless the .test-env marker is present (so it can never restart
# the prod process by mistake if run in the prod checkout).
# The test .env, venv/ and affiliate_test.db are gitignored, so never touched.
set -euo pipefail
cd "$(dirname "$0")"

# Guard: only ever run inside the dedicated TEST checkout.
if [ ! -f .test-env ]; then
  echo "[deploy-test] REFUSING: .test-env marker not found in $(pwd)." >&2
  echo "[deploy-test] Run this only in the test checkout (/var/www/ambassador-backend-test)." >&2
  exit 1
fi

APP=ambassador-api-test
HEALTH="https://test-ambassador-api.bheuni.uk/public/payout-policy"

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

venv/bin/pip install -q -r requirements.txt

echo "[deploy-test] restarting $APP ..."
pm2 restart "$APP" --update-env >/dev/null

for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH" || true)
  if [ "$code" = "200" ]; then
    echo "[deploy-test] OK, healthy ($code) at $NEW"
    exit 0
  fi
  sleep 1
done

echo "[deploy-test] FAIL: health check never returned 200 (last=$code). Rolling back to $PREV"
git reset --hard "$PREV"
pm2 restart "$APP" --update-env >/dev/null
echo "[deploy-test] rolled back to $PREV"
exit 1
