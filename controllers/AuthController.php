<?php
/* =============================================
   SMPM — Controller: Auth (Login / Logout)
   ============================================= */

require_once __DIR__ . '/../models/User.php';

class AuthController {
    private User $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /** Tampilkan halaman login */
    public function showLogin(): void {
        // Jika sudah login, redirect ke dashboard
        if (!empty($_SESSION['user'])) {
            header('Location: index.php?page=dashboard');
            exit;
        }
        $error = $_SESSION['login_error'] ?? null;
        unset($_SESSION['login_error']);
        require_once __DIR__ . '/../views/auth/login.php';
    }

    /** Proses form login (POST) */
    public function processLogin(): void {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=login');
            exit;
        }

        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        // Validasi input dasar
        if (empty($email) || empty($password)) {
            $_SESSION['login_error'] = 'Email dan password wajib diisi.';
            header('Location: index.php?page=login');
            exit;
        }

        $user = $this->userModel->findByEmail($email);

        // Verifikasi password (bcrypt)
        if (!$user || !password_verify($password, $user['password'])) {
            $_SESSION['login_error'] = 'Email atau password salah. Coba lagi.';
            header('Location: index.php?page=login');
            exit;
        }

        // Simpan data user ke session (tanpa password)
        unset($user['password']);
        $_SESSION['user'] = $user;

        // Redirect ke dashboard
        header('Location: index.php?page=dashboard');
        exit;
    }

    /** Logout */
    public function logout(): void {
        session_destroy();
        header('Location: index.php?page=login');
        exit;
    }
}
