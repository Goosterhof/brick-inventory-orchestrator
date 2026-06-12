FROM php:8.5-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql pcntl zip gd \
    && curl -fsSL https://github.com/krakjoe/pcov/archive/refs/tags/v1.0.12.tar.gz -o /tmp/pcov.tar.gz \
    && tar -xzf /tmp/pcov.tar.gz -C /tmp \
    && (cd /tmp/pcov-1.0.12 && phpize && ./configure --enable-pcov && make -j"$(nproc)" && make install) \
    && docker-php-ext-enable pcov \
    && rm -rf /tmp/pcov.tar.gz /tmp/pcov-1.0.12 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
# pcov is built from the krakjoe/pcov GitHub tag, not `pecl install pcov`:
# pecl.php.net outages (504s on 2026-06-12) break this image build, and PECL
# is being sunset upstream. Pin tracks the latest pcov release; bump it when
# the PHP base image moves.

# Bump memory_limit above the php:8.5-cli default of 128M. `composer test`
# runs the full Pest suite with pcov coverage and refresh-DB; 128M OOMs
# before the suite finishes (and the OOM happens in a child process, so
# `php -d memory_limit=...` on the parent doesn't propagate).
RUN echo "memory_limit = 1G" > /usr/local/etc/php/conf.d/zz-memory.ini

# Install FrankenPHP binary (outside volume mount so it persists)
RUN curl -fsSL https://github.com/dunglas/frankenphp/releases/latest/download/frankenphp-linux-$(uname -m) -o /usr/local/bin/frankenphp \
    && chmod +x /usr/local/bin/frankenphp

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for layer caching
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-scripts --no-autoloader

# Copy application code
COPY . .

# Generate autoloader
RUN composer dump-autoload --optimize

# Expose port for Octane
EXPOSE 8000

# Start Laravel Octane
CMD ["php", "artisan", "octane:start", "--host=0.0.0.0", "--port=8000"]
