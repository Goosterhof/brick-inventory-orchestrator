# syntax=docker/dockerfile:1.7
#
# Production image: backend serves frontend.
#
# Multi-stage build:
#   1. Build the Vue `families` app with Vite → frontend/dist/families/
#   2. Install Composer dependencies for the backend (no-dev, no-scripts)
#   3. Assemble a FrankenPHP-based runtime image with the backend code and
#      vendor/, then overlay the frontend's dist on top of backend/public/.
#
# FrankenPHP serves /var/www/html/public via its embedded Caddy server:
# static files (index.html, assets/*) hit the file system directly; routes
# under /api/* flow through Laravel; any other route falls through to
# Laravel's Route::fallback() defined in backend/routes/web.php, which
# returns the SPA's index.html so Vue Router takes over client-side.

ARG PHP_VERSION=8.5.12
ARG NODE_VERSION=24.22.1

# ============================================================
# Stage 1 — Frontend build
# ============================================================
FROM node:${NODE_VERSION}-alpine AS frontend-builder

WORKDIR /frontend

# Cache npm deps separately from source.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --prefer-offline

COPY frontend/ ./

# Vite inlines import.meta.env.* into the bundle at build time. Default to
# /api so the SPA talks to the same origin in production. Override via
# `--build-arg VITE_API_BASE_URL=...` if a different host is desired.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build both shipping apps. families goes to backend/public/, admin goes to
# backend/public/admin/ (the admin script already passes --base=/admin/ so
# Vite emits the right asset URLs and Vue Router picks up BASE_URL).
RUN npm run build:families && npm run build:admin

# ============================================================
# Stage 2 — Composer install (no scripts, no dev)
# ============================================================
FROM composer:2 AS composer-deps

WORKDIR /app

COPY backend/composer.json backend/composer.lock ./
# `composer:2` is Alpine with a minimal PHP — ext-pcntl is not loaded.
# The vendor tree itself is platform-independent (composer just verifies
# requirements at install time), and the final php:8.5-cli stage below
# does install pcntl, so it's safe to skip the platform check here.
RUN composer install \
    --no-scripts \
    --no-autoloader \
    --no-dev \
    --prefer-dist \
    --no-progress \
    --no-interaction \
    --ignore-platform-req=ext-pcntl

# ============================================================
# Stage 3 — Final runtime image
# ============================================================
FROM php:${PHP_VERSION}-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl git unzip \
        libpq-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pcntl zip gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# FrankenPHP binary (Caddy + PHP, single process).
# Use the `-gnu` variant — the base image is Debian (glibc). The
# default `frankenphp-linux-x86_64` is the musl static build; mixing
# musl with a glibc system has caused Octane to silently fail to
# launch FrankenPHP at runtime. Octane's own downloader makes the same
# distinction (vendor/laravel/octane/src/Commands/Concerns/InstallsFrankenPhpDependencies.php).
# Fetched from our mirror, not upstream's release asset: upstream rebuilds
# assets in place, so a sha256 pin on its URL dies by design (WR-0652). The
# mirror holds x86_64 only. The version assertion fails the build when the tag
# and version desync (WR-2848).
ARG FRANKENPHP_VERSION=1.13.5
ARG FRANKENPHP_MIRROR_TAG=frankenphp-v1.13.5-r20261106
ARG FRANKENPHP_SHA256=afdca5ccd41c79c891365c1efdc93f551225b7d028ffbaf1f6792b2283d11778
RUN curl -fsSL "https://github.com/script-development/town-crier-artifacts/releases/download/${FRANKENPHP_MIRROR_TAG}/frankenphp-linux-x86_64-gnu" \
        -o /usr/local/bin/frankenphp \
    && echo "${FRANKENPHP_SHA256}  /usr/local/bin/frankenphp" | sha256sum -c - \
    && chmod +x /usr/local/bin/frankenphp \
    && /usr/local/bin/frankenphp version \
    && /usr/local/bin/frankenphp version | grep -qF "v${FRANKENPHP_VERSION} "

# One ini for two runtimes: the web service's embedded PHP scans only its
# compiled /etc/frankenphp/php.d, the queue worker's system PHP only conf.d.
# post_max_size holds 5 screenshots of 3 MB plus the form; upload_max_filesize
# holds the 10 MB brick photo. The build fails if either runtime misses a value
# (WR-2851).
RUN printf '%s\n' \
        'memory_limit = 512M' \
        'display_errors = Off' \
        'display_startup_errors = Off' \
        'log_errors = On' \
        'expose_php = Off' \
        'upload_max_filesize = 10M' \
        'post_max_size = 20M' \
        > /usr/local/etc/php/conf.d/zz-bio.ini \
    && mkdir -p /etc/frankenphp/php.d \
    && ln -s /usr/local/etc/php/conf.d/zz-bio.ini /etc/frankenphp/php.d/zz-bio.ini \
    && ASSERT='foreach (["memory_limit" => "512M", "display_errors" => "", "display_startup_errors" => "", "log_errors" => "1", "expose_php" => "", "upload_max_filesize" => "10M", "post_max_size" => "20M"] as $k => $v) { if (ini_get($k) !== $v) { fwrite(STDERR, PHP_BINARY." $k=".var_export(ini_get($k), true)."\n"); exit(1); } }' \
    && /usr/local/bin/frankenphp php-cli -r "$ASSERT" \
    && php -r "$ASSERT"

# Composer at runtime for deploy-step artisan commands.
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY backend/ ./
COPY --from=composer-deps /app/vendor ./vendor

# Overlay the frontend dists onto Laravel's public/. families lives at the
# root (index.html + assets/*); admin lives in a subdirectory (admin/index.html
# + admin/assets/*). backend's public/ already has index.php, .htaccess,
# favicon.ico, robots.txt. The dists coexist — FrankenPHP serves static
# files first and falls through to index.php (Laravel) for everything else.
COPY --from=frontend-builder /frontend/dist/families/ ./public/
COPY --from=frontend-builder /frontend/dist/admin/ ./public/admin/

RUN composer dump-autoload --optimize --no-dev

# Pre-install the FrankenPHP worker shim that Octane requires at runtime.
# Otherwise `octane:start` lazily copies it from the vendor stub on first
# launch, which can hide failures behind silent retries. Copying it here
# makes the build self-contained and the runtime startup deterministic.
RUN cp vendor/laravel/octane/src/Commands/stubs/frankenphp-worker.php public/frankenphp-worker.php

EXPOSE 8000

# config:cache / view:cache need APP_KEY at runtime; route:cache can't
# serialize the closure in routes/web.php (swap to a controller when route
# caching matters). Both groups are deferred to the deploy step.
CMD ["php", "artisan", "octane:start", "--server=frankenphp", "--host=0.0.0.0", "--port=8000"]
