<?php
declare(strict_types=1);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

session_set_cookie_params([
    'lifetime' => 0, 'path' => '/', 'secure' => $isHttps,
    'httponly' => true, 'samesite' => 'Lax',
]);
session_start();

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/migrate.php';
try { runMigrations(Database::getConnection()); } catch (Throwable $e) { error_log('migrate: '.$e->getMessage()); }

// Serve index.html, patch.js akan memanggil api.php?action=check_session
// untuk memverifikasi session ke server setiap kali halaman dibuka.
// Dengan begitu user yang belum login selalu diarahkan ke halaman login.
$html = file_get_contents(__DIR__ . '/index.html');

// Sisipkan patch.js setelah app.js
$html = str_replace(
    '<script src="js/app.js"></script>',
    '<script src="js/app.js"></script>' . "\n" .
    '<script src="js/patch.js"></script>',
    $html
);

echo $html;
