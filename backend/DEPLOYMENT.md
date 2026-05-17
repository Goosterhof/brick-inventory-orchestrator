# Deployment Guide

This guide covers deploying the LEGO Storage API to **Railway** with **PostgreSQL**.

## Why Railway?

- Accepts PayPal (no credit card required)
- $5 free credit per month
- Auto-detects Laravel and configures PHP-FPM + nginx
- Built-in PostgreSQL database

## 1. Create Railway Project

1. Go to https://railway.app and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway auto-detects Laravel and builds with Nixpacks

## 2. Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically creates the database

## 3. Configure Environment Variables

Go to your web service → **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `APP_NAME` | `LEGO Storage` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | Generate with `php artisan key:generate --show` |
| `APP_URL` | `https://your-app.up.railway.app` |
| `DB_CONNECTION` | `pgsql` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (click "Add Reference") |
| `LOG_CHANNEL` | `stderr` |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `sync` |
| `REBRICKABLE_API_KEY` | Your API key |

## 4. Deploy

Railway deploys automatically when you push. After first deploy:

1. Go to **Settings** → **Networking** → **Generate Domain**
2. Update `APP_URL` with your new domain

## 5. Major Framework Upgrades

Use this checklist for any major Laravel version bump (e.g., 12 → 13). The current production `QUEUE_CONNECTION=sync` means queues run in-process and the drain step below is a no-op today, but the project is queue-ready (`ImportOwnedSetsJob`) and this checklist is the authoritative playbook for the day we flip to `database` or `redis`.

1. **Merge the framework bump behind a feature flag or on a staging slot first.** Never push a major version to the only production web service without a rollback lane.
2. **Drain queue workers before the new image goes live.** Serialized jobs from the old framework may fail to deserialize on the new one, silently moving jobs to `failed_jobs`. Drain procedure:
   - Pause dispatch (scale the web service to zero new requests, or set a feature flag that blocks `StartImportAction`).
   - On each worker container: `php artisan queue:restart` then wait for in-flight jobs to finish, or `php artisan queue:work --stop-when-empty` for a clean drain.
   - Verify `jobs` table (database driver) or Redis queue is empty before releasing the new image.
3. **Migrate:** `railway run php artisan migrate --force` (Laravel migrations are forward-compatible within a major bump in this project's schema).
4. **Clear caches:**
   ```bash
   railway run php artisan config:clear
   railway run php artisan cache:clear
   railway run php artisan route:clear
   ```
5. **Smoke-test** the critical paths (auth, `POST /family/import`, `GET /family-sets/completion`) before unpausing workers.
6. **Un-pause dispatch** and confirm workers pick up new jobs.

The golden rule: a job serialized on framework version N-1 is not guaranteed to deserialize on N. Drain, deploy, resume.

## Troubleshooting

### View Logs
Click on your deployment to see build and runtime logs.

### Run Migrations Manually
Use Railway's shell or CLI:
```bash
railway run php artisan migrate --force
```

### Clear Caches
```bash
railway run php artisan config:clear
railway run php artisan cache:clear
```

## Local Development

Keep using SQLite locally:
```env
DB_CONNECTION=sqlite
```
