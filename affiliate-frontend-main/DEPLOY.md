# Deploying the Ambassador Portal Frontend

Production is a **git checkout** at `/var/www/ambassador-frontend` on
`root@46.101.72.146`, run by pm2 as **`ambassador-portal`** (`next start`).
**`main` is production.**

## Deploy
```bash
ssh root@46.101.72.146
cd /var/www/ambassador-frontend
./deploy.sh
```
`deploy.sh` runs: `git pull --ff-only origin main` → `npm ci` **only if**
`package-lock.json` changed → `npm run build` → `pm2 restart ambassador-portal`
(it uses `pm2 restart`, so it never re-applies `ecosystem.config.js`) →
health-check `/login` → **auto-rollback** + rebuild if health fails.

> **First deploy only (bootstrap):** if `deploy.sh` isn't on the server yet
> (the checkout is sitting on an older commit that predates it), run the steps once
> by hand — after that `./deploy.sh` is present:
> ```bash
> cd /var/www/ambassador-frontend
> git pull --ff-only origin main && npm ci && npm run build && pm2 restart ambassador-portal
> ```

## Rules
- **main = production.** Land changes on `main`, then `./deploy.sh`. Never edit files on the server directly.
- Never committed, never touched by a deploy (all gitignored): `.env.local`, `node_modules/`, `.next/`.
- Health: `curl -s -o /dev/null -w '%{http_code}' https://ambassador.bheuni.uk/login` → `200`.

## Manual rollback
```bash
cd /var/www/ambassador-frontend
git reset --hard HEAD@{1}
npm run build
pm2 restart ambassador-portal
```

## Notes
- The server dir is owned by a legacy UID; git runs as root via a `safe.directory`
  allow-list in `/root/.gitconfig`. Deploys run as root over SSH.
