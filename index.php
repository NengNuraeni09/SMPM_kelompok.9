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

// Paksa browser tidak cache HTML agar perubahan langsung terlihat
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/migrate.php';
try { runMigrations(Database::getConnection()); } catch (Throwable $e) { error_log('migrate: '.$e->getMessage()); }

// Serve index.html, patch.js akan memanggil api.php?action=check_session
// untuk memverifikasi session ke server setiap kali halaman dibuka.
// Dengan begitu user yang belum login selalu diarahkan ke halaman login.
$html = file_get_contents(__DIR__ . '/app.html');

// Cache-busting pakai MD5 isi file — berubah setiap kali file dimodifikasi
$ver    = substr(md5_file(__DIR__ . '/js/patch.js')  ?: uniqid(), 0, 8)
        . substr(md5_file(__DIR__ . '/js/app.js')    ?: uniqid(), 0, 8);
$cssVer = substr(md5_file(__DIR__ . '/css/style.css') ?: uniqid(), 0, 8);

// Sisipkan patch.js setelah app.js dengan versi cache-busting
$html = str_replace(
    '<script src="js/app.js"></script>',
    '<script src="js/app.js?v=' . $ver . '"></script>' . "\n" .
    '<script src="js/patch.js?v=' . $ver . '"></script>',
    $html
);

// Cache-busting untuk CSS
$html = str_replace(
    '<link rel="stylesheet" href="css/style.css" />',
    '<link rel="stylesheet" href="css/style.css?v=' . $cssVer . '" />',
    $html
);

echo $html;
