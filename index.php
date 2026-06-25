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

$sessionUser = isset($_SESSION['user']) ? json_encode($_SESSION['user']) : 'null';

$html = file_get_contents(__DIR__ . '/index.html');

// Inject window.__SMPM_SESSION__ + patch.js setelah app.js
// patch.js mengganti DOMContentLoaded app.js agar pakai API
$html = str_replace(
    '<script src="js/app.js"></script>',
    '<script>window.__SMPM_SESSION__ = ' . $sessionUser . ';</script>' . "\n" .
    '<script src="js/app.js"></script>' . "\n" .
    '<script src="js/patch.js"></script>',
    $html
);

echo $html;
