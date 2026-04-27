FROM php:8.2-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
        default-libmysqlclient-dev \
        libzip-dev \
        zip \
        unzip \
        git \
        curl \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql zip opcache pcntl

RUN pecl install redis && docker-php-ext-enable redis

RUN a2enmod rewrite

COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Bootstrap a complete Laravel 10 scaffold + vendor/ in one step.
# The volume mount in development overlays the code but the named
# backend_vendor volume keeps this vendor/ accessible.
RUN composer create-project laravel/laravel:^10.0 . --no-interaction

# Add project-specific packages
RUN composer require \
    "tymon/jwt-auth:^2.1" \
    "predis/predis:^2.2" \
    "league/flysystem-aws-s3-v3:^3.0" \
    --no-interaction

# Overlay custom application code on top of the Laravel scaffold.
# Files that exist in both are overwritten by ours; scaffold-only files remain.
COPY app/      app/
COPY config/   config/
COPY database/ database/
COPY routes/   routes/

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80
