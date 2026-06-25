<?php
/* =============================================
   SMPM — Controller: Dashboard
   ============================================= */

require_once __DIR__ . '/../models/Kelompok.php';
require_once __DIR__ . '/../models/Tugas.php';
require_once __DIR__ . '/../models/Upload.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Penilaian.php';

class DashboardController {
    private Kelompok  $kelompokModel;
    private Tugas     $tugasModel;
    private Upload    $uploadModel;
    private User      $userModel;
    private Penilaian $penilaianModel;

    public function __construct() {
        $this->kelompokModel  = new Kelompok();
        $this->tugasModel     = new Tugas();
        $this->uploadModel    = new Upload();
        $this->userModel      = new User();
        $this->penilaianModel = new Penilaian();
    }

    /** Dashboard utama — render berdasarkan role */
    public function index(): void {
        $this->requireLogin();
        $user = $_SESSION['user'];
        $role = $user['role'];
        $data = ['user' => $user];

        if ($role === 'mahasiswa') {
            $data = array_merge($data, $this->dataMahasiswa($user));
            require_once __DIR__ . '/../views/dashboard/mahasiswa.php';

        } elseif ($role === 'dosen') {
            $data = array_merge($data, $this->dataDosen());
            require_once __DIR__ . '/../views/dashboard/dosen.php';

        } elseif ($role === 'admin') {
            $data = array_merge($data, $this->dataAdmin());
            require_once __DIR__ . '/../views/dashboard/admin.php';
        }
    }

    /* ---------- private helpers ---------- */

    private function dataMahasiswa(array $user): array {
        $tugasList = $this->tugasModel->getByKelompok((int) $user['kelompok_id']);
        $kelompok  = $this->kelompokModel->findById((int) $user['kelompok_id']);
        $anggota   = $this->kelompokModel->getAnggota((int) $user['kelompok_id']);
        $uploads   = $this->uploadModel->getByKelompok((int) $user['kelompok_id']);
        $penilaian = $this->penilaianModel->getByKelompok((int) $user['kelompok_id']);

        $selesai   = count(array_filter($tugasList, fn($t) => $t['status'] === 'selesai'));
        $proses    = count(array_filter($tugasList, fn($t) => $t['status'] === 'proses'));
        $terlambat = count(array_filter($tugasList, fn($t) => $t['status'] === 'terlambat'));
        $pending   = count(array_filter($tugasList, fn($t) => $t['status'] === 'pending'));
        $total     = count($tugasList);
        $completion = $total > 0 ? round(($selesai / $total) * 100) : 0;

        return compact('tugasList', 'kelompok', 'anggota', 'uploads', 'penilaian',
                       'selesai', 'proses', 'terlambat', 'pending', 'total', 'completion');
    }

    private function dataDosen(): array {
        $kelompokList = $this->kelompokModel->getAll();
        $uploads      = $this->uploadModel->getAll();
        $tugasList    = $this->tugasModel->getAllWithKelompok();
        return compact('kelompokList', 'uploads', 'tugasList');
    }

    private function dataAdmin(): array {
        $users        = $this->userModel->getAll();
        $kelompokList = $this->kelompokModel->getAll();
        $uploads      = $this->uploadModel->getAll();
        $tugasList    = $this->tugasModel->getAllWithKelompok();
        $penilaianList = $this->penilaianModel->getAll();

        $totalMhs   = count(array_filter($users, fn($u) => $u['role'] === 'mahasiswa'));
        $totalDosen = count(array_filter($users, fn($u) => $u['role'] === 'dosen'));

        return compact('users', 'kelompokList', 'uploads', 'tugasList',
                       'penilaianList', 'totalMhs', 'totalDosen');
    }

    private function requireLogin(): void {
        if (empty($_SESSION['user'])) {
            header('Location: index.php?page=login');
            exit;
        }
    }
}
