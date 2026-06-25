<?php
/* =============================================
   SMPM — Controller: Tugas
   ============================================= */

require_once __DIR__ . '/../models/Tugas.php';
require_once __DIR__ . '/../models/Upload.php';
require_once __DIR__ . '/../models/Kelompok.php';

class TugasController {
    private Tugas    $tugasModel;
    private Upload   $uploadModel;
    private Kelompok $kelompokModel;

    // Tipe file yang diizinkan
    private const ALLOWED_MIME = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'image/png',
        'image/jpeg',
    ];
    private const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    private const UPLOAD_DIR = __DIR__ . '/../uploads/';

    public function __construct() {
        $this->tugasModel    = new Tugas();
        $this->uploadModel   = new Upload();
        $this->kelompokModel = new Kelompok();
    }

    /** Daftar tugas untuk mahasiswa */
    public function index(): void {
        $this->requireRole(['mahasiswa']);
        $user      = $_SESSION['user'];
        $tugasList = $this->tugasModel->getByKelompok((int) $user['kelompok_id']);
        require_once __DIR__ . '/../views/tugas/index.php';
    }

    /** Daftar & kelola tugas untuk dosen */
    public function dosenIndex(): void {
        $this->requireRole(['dosen']);
        $kelompokList = $this->kelompokModel->getAll();
        $tugasList    = $this->tugasModel->getAllWithKelompok();
        require_once __DIR__ . '/../views/tugas/dosen.php';
    }

    /** Buat tugas baru (POST, dosen) */
    public function store(): void {
        $this->requireRole(['dosen']);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: index.php?page=tugasDosen');
            exit;
        }

        $judul      = trim($_POST['judul'] ?? '');
        $kelompokId = (int) ($_POST['kelompok_id'] ?? 0);
        $assigneeId = (int) ($_POST['assignee_id'] ?? 0) ?: null;
        $deadline   = $_POST['deadline'] ?? '';
        $deskripsi  = trim($_POST['deskripsi'] ?? '');

        if (empty($judul) || !$kelompokId || empty($deadline)) {
            $_SESSION['flash_error'] = 'Judul, kelompok, dan deadline wajib diisi.';
            header('Location: index.php?page=tugasDosen');
            exit;
        }

        $this->tugasModel->create([
            'judul'       => $judul,
            'deskripsi'   => $deskripsi,
            'kelompok_id' => $kelompokId,
            'assignee_id' => $assigneeId,
            'deadline'    => $deadline,
            'status'      => 'pending',
            'created_by'  => $_SESSION['user']['id'],
        ]);

        $_SESSION['flash_success'] = 'Tugas berhasil ditambahkan.';
        header('Location: index.php?page=tugasDosen');
        exit;
    }

    /** Update status tugas (POST, mahasiswa) */
    public function updateStatus(): void {
        $this->requireRole(['mahasiswa', 'dosen']);
        $id     = (int) ($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? '';

        if (!$id || !$status) {
            $this->jsonResponse(['ok' => false, 'message' => 'Parameter tidak valid.'], 400);
        }

        $ok = $this->tugasModel->updateStatus($id, $status);
        $this->jsonResponse(['ok' => $ok]);
    }

    /** Upload file untuk tugas (POST, mahasiswa) */
    public function upload(): void {
        $this->requireRole(['mahasiswa']);
        $user    = $_SESSION['user'];
        $tugasId = (int) ($_POST['tugas_id'] ?? 0);

        if (!$tugasId) {
            $this->jsonResponse(['ok' => false, 'message' => 'Tugas tidak valid.'], 400);
        }

        $tugas = $this->tugasModel->findById($tugasId);
        if (!$tugas || (int) $tugas['kelompok_id'] !== (int) $user['kelompok_id']) {
            $this->jsonResponse(['ok' => false, 'message' => 'Akses ditolak.'], 403);
        }

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $this->jsonResponse(['ok' => false, 'message' => 'File tidak ditemukan atau gagal diupload.'], 400);
        }

        $file = $_FILES['file'];

        // Validasi ukuran
        if ($file['size'] > self::MAX_SIZE) {
            $this->jsonResponse(['ok' => false, 'message' => 'Ukuran file melebihi 10 MB.'], 400);
        }

        // Validasi tipe MIME
        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::ALLOWED_MIME, true)) {
            $this->jsonResponse(['ok' => false, 'message' => 'Tipe file tidak diizinkan.'], 400);
        }

        // Simpan file dengan nama unik
        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }
        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $saveName = uniqid('file_', true) . '.' . $ext;
        $savePath = self::UPLOAD_DIR . $saveName;
        move_uploaded_file($file['tmp_name'], $savePath);

        // Simpan ke DB
        $this->uploadModel->create([
            'nama_file'   => htmlspecialchars($file['name'], ENT_QUOTES, 'UTF-8'),
            'path_file'   => 'uploads/' . $saveName,
            'ukuran'      => $file['size'],
            'tipe'        => strtoupper($ext),
            'kelompok_id' => $user['kelompok_id'],
            'user_id'     => $user['id'],
            'tugas_id'    => $tugasId,
        ]);

        // Tandai tugas selesai
        $this->tugasModel->updateStatus($tugasId, 'selesai');

        $this->jsonResponse(['ok' => true, 'message' => 'File berhasil diupload, tugas ditandai selesai.']);
    }

    /** Hapus tugas (POST, dosen) */
    public function delete(): void {
        $this->requireRole(['dosen']);
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            $this->jsonResponse(['ok' => false, 'message' => 'ID tidak valid.'], 400);
        }
        $ok = $this->tugasModel->delete($id);
        $this->jsonResponse(['ok' => $ok]);
    }

    /* ---------- helpers ---------- */

    private function requireRole(array $roles): void {
        if (empty($_SESSION['user']) || !in_array($_SESSION['user']['role'], $roles, true)) {
            header('Location: index.php?page=login');
            exit;
        }
    }

    private function jsonResponse(array $data, int $code = 200): never {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
