<?php
/* =============================================
   SMPM — Setup Script (jalankan sekali saja)
   Akses: https://domain-kamu.up.railway.app/setup.php
   HAPUS file ini setelah setup selesai!
   ============================================= */

// Keamanan: hanya bisa diakses dengan token
$token = getenv('SETUP_TOKEN') ?: 'smpm_setup_2024';
if (($_GET['token'] ?? '') !== $token) {
    http_response_code(403);
    die('<h2>403 Forbidden</h2><p>Tambahkan ?token=YOUR_SETUP_TOKEN di URL</p>');
}

require_once __DIR__ . '/config/database.php';

$pdo = Database::getConnection();
$sql = file_get_contents(__DIR__ . '/init.sql');

// Pisah per statement dan jalankan satu per satu
$statements = array_filter(
    array_map('trim', explode(';', $sql)),
    fn($s) => !empty($s) && !str_starts_with($s, '--')
);

$success = 0;
$errors  = [];

foreach ($statements as $stmt) {
    try {
        $pdo->exec($stmt);
        $success++;
    } catch (PDOException $e) {
        $errors[] = htmlspecialchars($e->getMessage());
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>SMPM Setup</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 60px auto; padding: 20px; }
    .ok  { background: #dcfce7; color: #16a34a; padding: 12px 16px; border-radius: 8px; }
    .err { background: #fee2e2; color: #dc2626; padding: 12px 16px; border-radius: 8px; margin-top: 8px; font-size: .85rem; }
    h1   { color: #0b1f3a; }
    a    { color: #2f80ed; }
  </style>
</head>
<body>
  <h1>🛠 SMPM — Database Setup</h1>
  <div class="ok">
    ✓ <?= $success ?> statement berhasil dieksekusi.
  </div>
  <?php foreach ($errors as $e): ?>
  <div class="err">✕ <?= $e ?></div>
  <?php endforeach; ?>
  <hr style="margin:24px 0">
  <p>
    <?php if (empty($errors)): ?>
    ✅ Setup selesai! <a href="index.php">→ Buka Aplikasi</a>
    <br><br>
    <strong style="color:#dc2626">⚠ PENTING: Hapus file setup.php setelah ini!</strong>
    <?php else: ?>
    Setup selesai dengan beberapa error (mungkin tabel sudah ada sebelumnya — itu normal).
    <a href="index.php">→ Coba buka aplikasi</a>
    <?php endif; ?>
  </p>
  <hr>
  <p style="font-size:.8rem;color:#94a3b8">
    Login demo: <strong>admin@kampus.ac.id</strong> / password: <strong>password</strong>
  </p>
</body>
</html>
