<?php
/* =============================================
   SMPM — Entry Point
   Serve index.html asli + inject session user
   ke window.__SMPM_SESSION__ untuk app.js
   ============================================= */
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

// Inject session user sebagai JSON ke halaman agar app.js bisa baca
$sessionUser = isset($_SESSION['user']) ? json_encode($_SESSION['user']) : 'null';

// Baca index.html asli
$html = file_get_contents(__DIR__ . '/index.html');

// 1. Inject session PHP ke window SEBELUM app.js
$inject = '<script>window.__SMPM_SESSION__ = ' . $sessionUser . ';</script>' . "\n";

// 2. Tambahkan backend.js SETELAH app.js (override fungsi mock DB)
$html = str_replace(
    '<script src="js/app.js"></script>',
    $inject . '<script src="js/app.js"></script>' . "\n" . '<script src="js/backend.js"></script>',
    $html
);

echo $html;
