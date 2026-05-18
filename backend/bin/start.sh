#!/usr/bin/env bash
# Container entrypoint for Railway. The same image is deployed to two
# services (web + queue worker); this script picks the mode by the
# QUEUE_WORKER env var so railway.toml can stay single-source-of-truth.
#
# Why this script and not a per-service startCommand in railway.toml:
# Railway locks any value defined in railway.toml — dashboard fields go
# read-only — and there's no per-service override syntax in a single
# file. Branching here keeps both commands in version control and lets
# each Railway service differ by a single env var.
#
# Why bash and not /bin/sh: Railway exec()s startCommand without a
# shell, so railway.toml's startCommand wraps this in `bash …`. Inside
# the script, `&&` works because we are now in a real shell.

set -euo pipefail

if [[ -n "${QUEUE_WORKER:-}" ]]; then
    # Queue worker: drain the database queue. --max-time recycles the
    # process hourly so memory leaks don't compound. Railway restarts
    # on exit (restartPolicyType=ON_FAILURE), so the recycle is invisible.
    exec php artisan queue:work \
        --queue=default \
        --tries=3 \
        --backoff=10 \
        --timeout=60 \
        --max-time=3600
fi

# Web service: run pending migrations, then hand off to Octane/FrankenPHP.
# migrate runs before exec so failures bubble up and the deploy is marked
# unhealthy rather than serving a broken schema.
php artisan migrate --force
exec php artisan octane:start \
    --server=frankenphp \
    --host=0.0.0.0 \
    --port="${PORT:-8000}"
