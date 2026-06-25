<?php
/* =============================================
   SMPM — Controller: Admin
   ============================================= */

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Kelompok.php';
require_once __DIR__ . '/../models/Penilaian.php';

class AdminController {
    private User      $userModel;
    private Kelompok  $kelompokModel;
    private Penilaian $penilaianModel;

    public function __construct() {
        $this->userModel      = new User();
        $this->kelompokModel  = new Kelompok();
        $this->penilaianModel = new Penilaian();
    }

    /* ===== Kelola User ===== */

    public function manageUser(): void {
        $this->requireAdmin();
        $users = $this->userModel->getAll();
        $kelompokList = $this->kelompokModel->getAll();
        require_once __DIR__ . '/../views/admin/manage_user.php';
    }

    public function storeUser(): void {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=manageUser'); exit;
        }

        $nama       = trim($_POST['nama'] ?? '');
        $nim        = trim($_POST['nim'] ?? '');
        $email      = trim($_POST['email'] ?? '');
        $password   = $_POST['password'] ?? '';
        $role       = $_POST['role'] ?? 'mahasiswa';
        $kelompokId = (int) ($_POST['kelompok_id'] ?? 0) ?: null;

        if (empty($nama) || empty($nim) || empty($email) || empty($password)) {
            $_SESSION['flash_error'] = 'Semua field wajib diisi.';
            header('Location: index.php?page=manageUser'); exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $_SESSION['flash_error'] = 'Format email tidak valid.';
            header('Location: index.php?page=manageUser'); exit;
        }

        if ($this->userModel->emailExists($email)) {
            $_SESSION['flash_error'] = 'Email sudah terdaftar.';
            header('Location: index.php?page=manageUser'); exit;
        }

        $this->userModel->create([
            'nama'        => $nama,
            'nim'         => $nim,
            'email'       => $email,
            'password'    => $password,
            'role'        => $role,
            'kelompok_id' => $kelompokId,
        ]);

        $_SESSION['flash_success'] = 'User berhasil ditambahkan.';
        header('Location: index.php?page=manageUser'); exit;
    }

    public function updateUser(): void {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=manageUser'); exit;
        }

        $id   = (int) ($_POST['id'] ?? 0);
        $data = [
            'nama'        => trim($_POST['nama'] ?? ''),
            'nim'         => trim($_POST['nim'] ?? ''),
            'email'       => trim($_POST['email'] ?? ''),
            'role'        => $_POST['role'] ?? 'mahasiswa',
            'kelompok_id' => (int) ($_POST['kelompok_id'] ?? 0) ?: null,
        ];
        if (!empty($_POST['password'])) {
            $data['password'] = $_POST['password'];
        }

        $this->userModel->update($id, $data);
        $_SESSION['flash_success'] = 'User berhasil diperbarui.';
        header('Location: index.php?page=manageUser'); exit;
    }

    public function deleteUser(): void {
        $this->requireAdmin();
        $id = (int) ($_POST['id'] ?? 0);
        // Jangan hapus diri sendiri
        if ($id === (int) $_SESSION['user']['id']) {
            $_SESSION['flash_error'] = 'Tidak dapat menghapus akun sendiri.';
            header('Location: index.php?page=manageUser'); exit;
        }
        $this->userModel->delete($id);
        $_SESSION['flash_success'] = 'User berhasil dihapus.';
        header('Location: index.php?page=manageUser'); exit;
    }

    /* ===== Kelola Kelompok ===== */

    public function manageKelompok(): void {
        $this->requireAdmin();
        $kelompokList = $this->kelompokModel->getAll();
        $dosenList    = $this->getDosen();
        require_once __DIR__ . '/../views/admin/manage_kelompok.php';
    }

    public function storeKelompok(): void {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=manageKelompok'); exit;
        }

        $this->kelompokModel->create([
            'nama'     => trim($_POST['nama'] ?? ''),
            'tema'     => trim($_POST['tema'] ?? ''),
            'dosen_id' => (int) ($_POST['dosen_id'] ?? 0) ?: null,
            'status'   => $_POST['status'] ?? 'aktif',
        ]);

        $_SESSION['flash_success'] = 'Kelompok berhasil ditambahkan.';
        header('Location: index.php?page=manageKelompok'); exit;
    }

    public function updateKelompok(): void {
        $this->requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=manageKelompok'); exit;
        }

        $id = (int) ($_POST['id'] ?? 0);
        $this->kelompokModel->update($id, [
            'nama'     => trim($_POST['nama'] ?? ''),
            'tema'     => trim($_POST['tema'] ?? ''),
            'dosen_id' => (int) ($_POST['dosen_id'] ?? 0) ?: null,
            'progress' => (int) ($_POST['progress'] ?? 0),
            'status'   => $_POST['status'] ?? 'aktif',
        ]);

        $_SESSION['flash_success'] = 'Kelompok berhasil diperbarui.';
        header('Location: index.php?page=manageKelompok'); exit;
    }

    public function deleteKelompok(): void {
        $this->requireAdmin();
        $id = (int) ($_POST['id'] ?? 0);
        $this->kelompokModel->delete($id);
        $_SESSION['flash_success'] = 'Kelompok berhasil dihapus.';
        header('Location: index.php?page=manageKelompok'); exit;
    }

    /* ===== Penilaian (dosen) ===== */

    public function storePenilaian(): void {
        $this->requireRole(['dosen']);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=penilaian'); exit;
        }

        $this->penilaianModel->upsert([
            'kelompok_id' => (int) ($_POST['kelompok_id'] ?? 0),
            'dosen_id'    => (int) $_SESSION['user']['id'],
            'nilai'       => (int) ($_POST['nilai'] ?? 0),
            'feedback'    => trim($_POST['feedback'] ?? ''),
        ]);

        $_SESSION['flash_success'] = 'Penilaian berhasil disimpan.';
        header('Location: index.php?page=penilaian'); exit;
    }

    /* ---------- helpers ---------- */

    private function getDosen(): array {
        return array_filter(
            $this->userModel->getAll(),
            fn($u) => $u['role'] === 'dosen'
        );
    }

    private function requireAdmin(): void {
        $this->requireRole(['admin']);
    }

    private function requireRole(array $roles): void {
        if (empty($_SESSION['user']) || !in_array($_SESSION['user']['role'], $roles, true)) {
            header('Location: index.php?page=login');
            exit;
        }
    }
}
