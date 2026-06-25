<?php
/* =============================================
   SMPM — Model: Upload
   ============================================= */

require_once __DIR__ . '/../config/database.php';

class Upload {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getByKelompok(int $kelompokId): array {
        $stmt = $this->db->prepare(
            'SELECT up.*, u.nama AS uploader_nama, t.judul AS tugas_judul
             FROM uploads up
             LEFT JOIN users u ON up.user_id = u.id
             LEFT JOIN tugas t ON up.tugas_id = t.id
             WHERE up.kelompok_id = ?
             ORDER BY up.uploaded_at DESC'
        );
        $stmt->execute([$kelompokId]);
        return $stmt->fetchAll();
    }

    public function getAll(): array {
        return $this->db->query(
            'SELECT up.*, u.nama AS uploader_nama, k.nama AS kelompok_nama, t.judul AS tugas_judul
             FROM uploads up
             LEFT JOIN users u ON up.user_id = u.id
             LEFT JOIN kelompok k ON up.kelompok_id = k.id
             LEFT JOIN tugas t ON up.tugas_id = t.id
             ORDER BY up.uploaded_at DESC'
        )->fetchAll();
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare('SELECT * FROM uploads WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO uploads (nama_file, path_file, ukuran, tipe, kelompok_id, user_id, tugas_id)
             VALUES (:nama_file, :path_file, :ukuran, :tipe, :kelompok_id, :user_id, :tugas_id)'
        );
        $stmt->execute([
            ':nama_file'   => $data['nama_file'],
            ':path_file'   => $data['path_file'],
            ':ukuran'      => $data['ukuran'],
            ':tipe'        => $data['tipe'],
            ':kelompok_id' => $data['kelompok_id'],
            ':user_id'     => $data['user_id'],
            ':tugas_id'    => $data['tugas_id'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare('DELETE FROM uploads WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
