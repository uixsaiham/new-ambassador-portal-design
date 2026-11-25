# Deploying the Ambassador Portal API

Production is a **git checkout** at `/var/www/ambassador-backend` on
`root@46.101.72.146`, run by pm2 as **`ambassador-api`** (uvicorn).
**`main` is production.**

## Deploy
```bash
ssh root@46.101.72.146
cd /var/www/ambassador-backend
./deploy.sh
```
`deploy.sh` runs: `git pull --ff-only origin main` → `pip install` **only if**
`requirements.txt` changed → `pm2 restart ambassador-api` → health-check
`/public/payout-policy` → **auto-rollback** to the previous commit if health fails.

## Rules
- **main = production.** Land changes on `main`, then `./deploy.sh`. Never edit files on the server directly.
- Never committed, never touched by a deploy (all gitignored): `.env`, `venv/`,
  `affiliate.db` (+ `affiliate.db-wal`/`-shm`), `.affiliate.db-litestream/`.
- Health: `curl -s -o /dev/null -w '%{http_code}' https://affiliate.bheuni.uk/public/payout-policy` → `200`.

## Manual rollback
```bash
cd /var/www/ambassador-backend
git reset --hard HEAD@{1}      # back to the previous deployed commit
pm2 restart ambassador-api
```

## Notes
- The server dir is owned by a legacy UID; git runs as root via a `safe.directory`
  allow-list in `/root/.gitconfig`. Deploys run as root over SSH.
- The DB is replicated continuously by Litestream — do not delete `affiliate.db-*`
  or `.affiliate.db-litestream/`.
