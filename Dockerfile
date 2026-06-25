FROM php:8.4-cli

# Install ekstensi pdo_mysql
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

COPY . .

EXPOSE 8080

CMD ["sh", "-c", "php -S 0.0.0.0:$PORT -t /app"]
