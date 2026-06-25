<?php
/* =============================================
   SMPM — API Endpoint
   Semua request AJAX dari app.js masuk sini.
   Mengembalikan JSON.
   ============================================= */
declare(strict_types=1);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/migrate.php';

// Auto migrate kalau belum ada tabel
try { runMigrations(Database::getConnection()); } catch (Throwable $e) { /* skip */ }

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// ============================================================
// HELPER
// ============================================================
function jsonOk(mixed $data = null): never {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}
function jsonErr(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $msg]);
    exit;
}
function requireLogin(): void {
    if (empty($_SESSION['user'])) jsonErr('Sesi habis. Silakan login ulang.', 401);
}
function requireRole(array $roles): void {
    requireLogin();
    if (!in_array($_SESSION['user']['role'], $roles, true))
        jsonErr('Akses ditolak.', 403);
}
function db(): PDO { return Database::getConnection(); }

// ============================================================
// ROUTING
// ============================================================
switch ($action) {

    /* ---------- AUTH ---------- */

    case 'login':
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        if (!$email || !$password) jsonErr('Email dan password wajib diisi.');

        $stmt = db()->prepare('SELECT * FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password']))
            jsonErr('Email atau password salah.');

        unset($user['password']);
        $_SESSION['user'] = $user;
        jsonOk($user);

    case 'logout':
        session_destroy();
        jsonOk();

    case 'check_session':
        if (!empty($_SESSION['user'])) {
            // Refresh dari DB
            $stmt = db()->prepare('SELECT id,nama,nim,email,role,avatar,kelompok_id FROM users WHERE id=? LIMIT 1');
            $stmt->execute([$_SESSION['user']['id']]);
            $fresh = $stmt->fetch();
            if ($fresh) { $_SESSION['user'] = $fresh; jsonOk($fresh); }
        }
        jsonErr('Tidak ada sesi aktif.', 401);

    case 'register':
        $nama       = trim($_POST['nama'] ?? '');
        $nim        = trim($_POST['nim'] ?? '');
        $email      = trim($_POST['email'] ?? '');
        $password   = $_POST['password'] ?? '';
        $kelompokId = (int)($_POST['kelompok_id'] ?? 0) ?: null;

        if (!$nama || !$nim || !$email || !$password)
            jsonErr('Semua field wajib diisi.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL))
            jsonErr('Format email tidak valid.');
        if (strlen($password) < 6)
            jsonErr('Password minimal 6 karakter.');

        // Cek email sudah ada
        $chk = db()->prepare('SELECT id FROM users WHERE email=? LIMIT 1');
        $chk->execute([$email]);
        if ($chk->fetch()) jsonErr('Email sudah terdaftar.');

        $avatar = strtoupper(mb_substr($nama, 0, 1)) . strtoupper(mb_substr(explode(' ', $nama)[1] ?? $nim, 0, 1));
        $hash   = password_hash($password, PASSWORD_BCRYPT);
        $ins = db()->prepare('INSERT INTO users (nama,nim,email,password,role,avatar,kelompok_id) VALUES (?,?,?,?,?,?,?)');
        $ins->execute([$nama, $nim, $email, $hash, 'mahasiswa', $avatar, $kelompokId]);
        $newId = (int) db()->lastInsertId();

        $stmt = db()->prepare('SELECT id,nama,nim,email,role,avatar,kelompok_id FROM users WHERE id=?');
        $stmt->execute([$newId]);
        $newUser = $stmt->fetch();
        $_SESSION['user'] = $newUser;
        jsonOk($newUser);

    /* ---------- DATA (butuh login) ---------- */

    case 'get_data':
        requireLogin();
        $user = $_SESSION['user'];

        // Ambil semua data yang dibutuhkan frontend sesuai role
        $kelompok   = db()->query('SELECT k.*,u.nama AS dosen_nama FROM kelompok k LEFT JOIN users u ON k.dosen_id=u.id ORDER BY k.id')->fetchAll();
        $users      = db()->query('SELECT id,nama,nim,email,role,avatar,kelompok_id FROM users ORDER BY role,nama')->fetchAll();
        $tugas      = db()->query('SELECT * FROM tugas ORDER BY deadline ASC')->fetchAll();
        $uploads    = db()->query('SELECT * FROM uploads ORDER BY uploaded_at DESC')->fetchAll();
        $penilaian  = db()->query('SELECT * FROM penilaian')->fetchAll();

        jsonOk(compact('kelompok','users','tugas','uploads','penilaian'));

    /* ---------- TUGAS ---------- */

    case 'add_tugas':
        requireRole(['dosen']);
        $judul      = trim($_POST['judul'] ?? '');
        $kelompokId = (int)($_POST['kelompok_id'] ?? 0);
        $assigneeId = (int)($_POST['assignee_id'] ?? 0) ?: null;
        $deadline   = $_POST['deadline'] ?? '';
        $deskripsi  = trim($_POST['deskripsi'] ?? '');
        if (!$judul || !$kelompokId || !$deadline) jsonErr('Judul, kelompok, dan deadline wajib.');
        $stmt = db()->prepare('INSERT INTO tugas (judul,deskripsi,kelompok_id,assignee_id,deadline,status,created_by) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$judul,$deskripsi,$kelompokId,$assigneeId,$deadline,'pending',$_SESSION['user']['id']]);
        $id = (int) db()->lastInsertId();
        $t = db()->prepare('SELECT * FROM tugas WHERE id=?'); $t->execute([$id]);
        jsonOk($t->fetch());

    case 'delete_tugas':
        requireRole(['dosen']);
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) jsonErr('ID tidak valid.');
        db()->prepare('DELETE FROM tugas WHERE id=?')->execute([$id]);
        jsonOk();

    case 'update_status_tugas':
        requireLogin();
        $id     = (int)($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? '';
        $allowed = ['pending','proses','selesai','terlambat'];
        if (!$id || !in_array($status, $allowed, true)) jsonErr('Parameter tidak valid.');
        db()->prepare('UPDATE tugas SET status=? WHERE id=?')->execute([$status,$id]);
        jsonOk();

    /* ---------- UPLOAD FILE ---------- */

    case 'upload_file':
        requireRole(['mahasiswa']);
        $user    = $_SESSION['user'];
        $tugasId = (int)($_POST['tugas_id'] ?? 0);
        if (!$tugasId) jsonErr('Tugas tidak valid.');

        $t = db()->prepare('SELECT * FROM tugas WHERE id=? LIMIT 1'); $t->execute([$tugasId]);
        $tugas = $t->fetch();
        if (!$tugas || (int)$tugas['kelompok_id'] !== (int)$user['kelompok_id'])
            jsonErr('Akses ditolak.', 403);

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK)
            jsonErr('File tidak valid atau gagal diupload.');

        $file = $_FILES['file'];
        if ($file['size'] > 10 * 1024 * 1024) jsonErr('File melebihi 10 MB.');

        $allowed_mime = ['application/pdf','application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip','image/png','image/jpeg'];
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        if (!in_array($finfo->file($file['tmp_name']), $allowed_mime, true))
            jsonErr('Tipe file tidak diizinkan.');

        $dir = __DIR__ . '/uploads/';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $saveName = uniqid('f_', true) . '.' . $ext;
        move_uploaded_file($file['tmp_name'], $dir . $saveName);

        $ukuran = $file['size'] >= 1048576
            ? round($file['size']/1048576, 1) . ' MB'
            : round($file['size']/1024) . ' KB';

        $ins = db()->prepare('INSERT INTO uploads (nama_file,path_file,ukuran,tipe,kelompok_id,user_id,tugas_id) VALUES (?,?,?,?,?,?,?)');
        $ins->execute([
            htmlspecialchars($file['name'], ENT_QUOTES, 'UTF-8'),
            'uploads/' . $saveName,
            $file['size'],
            strtoupper($ext),
            (int)$user['kelompok_id'],
            (int)$user['id'],
            $tugasId
        ]);
        $newId = (int) db()->lastInsertId();
        db()->prepare('UPDATE tugas SET status=? WHERE id=?')->execute(['selesai',$tugasId]);

        $row = db()->prepare('SELECT * FROM uploads WHERE id=?'); $row->execute([$newId]);
        $up = $row->fetch();
        $up['ukuran'] = $ukuran; // human readable
        jsonOk($up);

    case 'delete_upload':
        requireLogin();
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) jsonErr('ID tidak valid.');
        $row = db()->prepare('SELECT * FROM uploads WHERE id=? LIMIT 1'); $row->execute([$id]);
        $up = $row->fetch();
        if (!$up) jsonErr('File tidak ditemukan.', 404);
        // Hanya pemilik atau dosen/admin yg boleh hapus
        $user = $_SESSION['user'];
        if ($user['role'] === 'mahasiswa' && (int)$up['user_id'] !== (int)$user['id'])
            jsonErr('Akses ditolak.', 403);
        // Hapus file fisik
        $path = __DIR__ . '/' . $up['path_file'];
        if (file_exists($path)) @unlink($path);
        db()->prepare('DELETE FROM uploads WHERE id=?')->execute([$id]);
        jsonOk();

    /* ---------- PENILAIAN ---------- */

    case 'save_penilaian':
        requireRole(['dosen']);
        $kelompokId = (int)($_POST['kelompok_id'] ?? 0);
        $nilai      = (int)($_POST['nilai'] ?? 0);
        $feedback   = trim($_POST['feedback'] ?? '');
        if (!$kelompokId) jsonErr('Kelompok tidak valid.');
        $stmt = db()->prepare(
            'INSERT INTO penilaian (kelompok_id,dosen_id,nilai,feedback)
             VALUES (?,?,?,?)
             ON DUPLICATE KEY UPDATE nilai=VALUES(nilai), feedback=VALUES(feedback), updated_at=NOW()'
        );
        $stmt->execute([$kelompokId, (int)$_SESSION['user']['id'], $nilai, $feedback]);
        jsonOk();

    /* ---------- ADMIN: USER ---------- */

    case 'add_user':
        requireRole(['admin']);
        $nama       = trim($_POST['nama'] ?? '');
        $nim        = trim($_POST['nim'] ?? '');
        $email      = trim($_POST['email'] ?? '');
        $password   = $_POST['password'] ?? '';
        $role       = $_POST['role'] ?? 'mahasiswa';
        $kelompokId = (int)($_POST['kelompok_id'] ?? 0) ?: null;
        if (!$nama||!$nim||!$email||!$password) jsonErr('Semua field wajib.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonErr('Format email tidak valid.');
        $chk = db()->prepare('SELECT id FROM users WHERE email=?'); $chk->execute([$email]);
        if ($chk->fetch()) jsonErr('Email sudah terdaftar.');
        $avatar = strtoupper(mb_substr($nama,0,1)).strtoupper(mb_substr(explode(' ',$nama)[1] ?? $nim,0,1));
        $ins = db()->prepare('INSERT INTO users (nama,nim,email,password,role,avatar,kelompok_id) VALUES (?,?,?,?,?,?,?)');
        $ins->execute([$nama,$nim,$email,password_hash($password,PASSWORD_BCRYPT),$role,$avatar,$kelompokId]);
        $id = (int)db()->lastInsertId();
        $s = db()->prepare('SELECT id,nama,nim,email,role,avatar,kelompok_id FROM users WHERE id=?'); $s->execute([$id]);
        jsonOk($s->fetch());

    case 'update_user':
        requireRole(['admin']);
        $id   = (int)($_POST['id'] ?? 0);
        $data = [
            'nama'        => trim($_POST['nama'] ?? ''),
            'nim'         => trim($_POST['nim'] ?? ''),
            'email'       => trim($_POST['email'] ?? ''),
            'role'        => $_POST['role'] ?? 'mahasiswa',
            'kelompok_id' => (int)($_POST['kelompok_id'] ?? 0) ?: null,
        ];
        if (!$id) jsonErr('ID tidak valid.');
        $fields = 'nama=:nama,nim=:nim,email=:email,role=:role,kelompok_id=:kelompok_id';
        $params = array_merge([':id'=>$id], array_combine(
            array_map(fn($k)=>":$k", array_keys($data)), $data
        ));
        if (!empty($_POST['password'])) {
            $fields .= ',password=:password';
            $params[':password'] = password_hash($_POST['password'], PASSWORD_BCRYPT);
        }
        db()->prepare("UPDATE users SET $fields WHERE id=:id")->execute($params);
        $s = db()->prepare('SELECT id,nama,nim,email,role,avatar,kelompok_id FROM users WHERE id=?'); $s->execute([$id]);
        jsonOk($s->fetch());

    case 'delete_user':
        requireRole(['admin']);
        $id = (int)($_POST['id'] ?? 0);
        if ($id === (int)$_SESSION['user']['id']) jsonErr('Tidak bisa hapus akun sendiri.');
        db()->prepare('DELETE FROM users WHERE id=?')->execute([$id]);
        jsonOk();

    /* ---------- ADMIN: KELOMPOK ---------- */

    case 'add_kelompok':
        requireRole(['admin']);
        $ins = db()->prepare('INSERT INTO kelompok (nama,tema,dosen_id,status) VALUES (?,?,?,?)');
        $ins->execute([
            trim($_POST['nama'] ?? ''),
            trim($_POST['tema'] ?? ''),
            (int)($_POST['dosen_id'] ?? 0) ?: null,
            $_POST['status'] ?? 'aktif'
        ]);
        $id = (int)db()->lastInsertId();
        $s = db()->prepare('SELECT k.*,u.nama AS dosen_nama FROM kelompok k LEFT JOIN users u ON k.dosen_id=u.id WHERE k.id=?'); $s->execute([$id]);
        jsonOk($s->fetch());

    case 'update_kelompok':
        requireRole(['admin']);
        $id = (int)($_POST['id'] ?? 0);
        db()->prepare('UPDATE kelompok SET nama=?,tema=?,dosen_id=?,progress=?,status=? WHERE id=?')
            ->execute([
                trim($_POST['nama'] ?? ''),
                trim($_POST['tema'] ?? ''),
                (int)($_POST['dosen_id'] ?? 0) ?: null,
                (int)($_POST['progress'] ?? 0),
                $_POST['status'] ?? 'aktif',
                $id
            ]);
        $s = db()->prepare('SELECT k.*,u.nama AS dosen_nama FROM kelompok k LEFT JOIN users u ON k.dosen_id=u.id WHERE k.id=?'); $s->execute([$id]);
        jsonOk($s->fetch());

    case 'delete_kelompok':
        requireRole(['admin']);
        $id = (int)($_POST['id'] ?? 0);
        db()->prepare('DELETE FROM kelompok WHERE id=?')->execute([$id]);
        jsonOk();

    /* ---------- RESET SEED PASSWORD (sekali pakai untuk fix password) ---------- */
    case 'reset_seed_password':
        // Endpoint sementara untuk reset password semua akun seed
        // Hanya bisa diakses dengan token khusus
        $token = $_GET['token'] ?? $_POST['token'] ?? '';
        if ($token !== 'smpm_reset_2024') jsonErr('Token tidak valid.', 403);

        $newHash = password_hash('password123', PASSWORD_BCRYPT);
        $emails = [
            'putri@kampus.ac.id',
            'intan@kampus.ac.id',
            'neng@kampus.ac.id',
            'dzurrahman@kampus.ac.id',
            'admin@kampus.ac.id',
        ];
        $stmt = db()->prepare('UPDATE users SET password = ? WHERE email = ?');
        $updated = 0;
        foreach ($emails as $email) {
            $stmt->execute([$newHash, $email]);
            $updated += $stmt->rowCount();
        }
        jsonOk(['updated' => $updated, 'message' => 'Password semua akun seed di-reset ke: password123']);

    default:
        jsonErr('Action tidak dikenal.', 404);
}
