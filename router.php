<?php
/**
 * Router untuk PHP built-in server
 * Tambahkan no-cache header untuk JS dan CSS
 * agar browser tidak cache file lama
 */

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$file = __DIR__ . $path;

// Serve JS dengan no-cache header
if (preg_match('/\.(js)$/i', $path) && file_exists($file)) {
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
    readfile($file);
    exit;
}

// Serve CSS dengan no-cache header
if (preg_match('/\.(css)$/i', $path) && file_exists($file)) {
    header('Content-Type: text/css; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
    readfile($file);
    exit;
}

// Semua file static lain (gambar, dll) — serve normal
if ($path !== '/' && file_exists($file) && !is_dir($file)
    && !preg_match('/\.(php)$/i', $path)) {
    return false; // biarkan PHP built-in server handle
}

// Semua request lain → index.php
require __DIR__ . '/index.php';
