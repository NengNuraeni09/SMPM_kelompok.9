<?php
/* =============================================
   SMPM — Front Controller (Entry Point)
   Semua request masuk ke sini, lalu diarahkan
   ke Controller yang sesuai (MVC Router)
   ============================================= */

declare(strict_types=1);

// Konfigurasi session aman (production)
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'  // Railway/proxy
        || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Autoload controllers & models
spl_autoload_register(function (string $class): void {
    $dirs = [
        __DIR__ . '/controllers/',
        __DIR__ . '/models/',
    ];
    foreach ($dirs as $dir) {
        $file = $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Ambil parameter routing
$page   = $_GET['page']   ?? 'login';
$action = $_GET['action'] ?? null;

// ============================================================
// ROUTING — petakan page/action ke Controller::method
// ============================================================

// --- AUTH ---
if ($action === 'login') {
    (new AuthController())->processLogin();
    exit;
}
if ($action === 'logout') {
    (new AuthController())->logout();
    exit;
}

// --- TUGAS (POST actions via action param) ---
if ($action === 'storeTugas') {
    (new TugasController())->store();
    exit;
}
if ($action === 'deleteTugas') {
    (new TugasController())->delete();
    exit;
}
if ($action === 'uploadTugas') {
    (new TugasController())->upload();
    exit;
}
if ($action === 'updateStatusTugas') {
    (new TugasController())->updateStatus();
    exit;
}

// --- ADMIN USER ---
if ($action === 'storeUser') {
    (new AdminController())->storeUser();
    exit;
}
if ($action === 'updateUser') {
    (new AdminController())->updateUser();
    exit;
}
if ($action === 'deleteUser') {
    (new AdminController())->deleteUser();
    exit;
}

// --- ADMIN KELOMPOK ---
if ($action === 'storeKelompok') {
    (new AdminController())->storeKelompok();
    exit;
}
if ($action === 'updateKelompok') {
    (new AdminController())->updateKelompok();
    exit;
}
if ($action === 'deleteKelompok') {
    (new AdminController())->deleteKelompok();
    exit;
}

// --- PENILAIAN ---
if ($action === 'storePenilaian') {
    (new AdminController())->storePenilaian();
    exit;
}

// ============================================================
// PAGE ROUTING — render halaman berdasarkan ?page=
// ============================================================

// Halaman yang tidak butuh login
$publicPages = ['login'];

if (!in_array($page, $publicPages, true) && empty($_SESSION['user'])) {
    header('Location: index.php?page=login');
    exit;
}

switch ($page) {

    // Auth
    case 'login':
        (new AuthController())->showLogin();
        break;

    // Dashboard (semua role — controller menentukan view berdasarkan role)
    case 'dashboard':
        (new DashboardController())->index();
        break;

    // Mahasiswa
    case 'tugas':
        (new TugasController())->index();
        break;

    // Dosen
    case 'tugasDosen':
        (new TugasController())->dosenIndex();
        break;

    // Admin
    case 'manageUser':
        (new AdminController())->manageUser();
        break;

    case 'manageKelompok':
        (new AdminController())->manageKelompok();
        break;

    // Halaman lain (placeholder — bisa dikembangkan)
    case 'deadline':
    case 'upload':
    case 'kelompok':
    case 'nilai':
    case 'monitoring':
    case 'penilaian':
        $pageTitle = match($page) {
            'deadline'   => 'Deadline Tracking',
            'upload'     => 'Upload Progress',
            'kelompok'   => 'Kelompok Saya',
            'nilai'      => 'Nilai Saya',
            'monitoring' => 'Monitoring Kelompok',
            'penilaian'  => 'Penilaian',
            default      => ucfirst($page),
        };
        require_once __DIR__ . '/views/layout/header.php';
        require_once __DIR__ . '/views/layout/sidebar.php';
        echo '<div class="main-content"><div class="page-body">';
        echo '<div class="page-header"><h1>' . htmlspecialchars($pageTitle) . '</h1></div>';
        echo '<div class="card"><p class="text-muted">Halaman ini sedang dalam pengembangan.</p></div>';
        echo '</div></div>';
        require_once __DIR__ . '/views/layout/footer.php';
        break;

    // 404
    default:
        http_response_code(404);
        echo '<h1>404 — Halaman tidak ditemukan</h1>';
        echo '<a href="index.php">← Kembali</a>';
        break;
}
