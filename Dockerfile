FROM php:8.4-cli

# Install ekstensi pdo_mysql
RUN docker-php-ext-install pdo pdo_mysql

# Set working directory
WORKDIR /app

# Copy semua file project
COPY . .

# Jalankan PHP built-in server
CMD php -S 0.0.0.0:$PORT -t .
