<?php
/* =============================================
   SMPM — Model: Kelompok
   ============================================= */

require_once __DIR__ . '/../config/database.php';

class Kelompok {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(): array {
        return $this->db->query(
            'SELECT k.*, u.nama AS dosen_nama
             FROM kelompok k
             LEFT JOIN users u ON k.dosen_id = u.id
             ORDER BY k.id'
        )->fetchAll();
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT k.*, u.nama AS dosen_nama
             FROM kelompok k
             LEFT JOIN users u ON k.dosen_id = u.id
             WHERE k.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getAnggota(int $kelompokId): array {
        $stmt = $this->db->prepare(
            'SELECT id, nama, nim, avatar FROM users
             WHERE kelompok_id = ? AND role = "mahasiswa"'
        );
        $stmt->execute([$kelompokId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO kelompok (nama, tema, dosen_id, progress, status)
             VALUES (:nama, :tema, :dosen_id, :progress, :status)'
        );
        $stmt->execute([
            ':nama'     => $data['nama'],
            ':tema'     => $data['tema'],
            ':dosen_id' => $data['dosen_id'] ?? null,
            ':progress' => $data['progress'] ?? 0,
            ':status'   => $data['status'] ?? 'aktif',
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->db->prepare(
            'UPDATE kelompok SET nama=:nama, tema=:tema, dosen_id=:dosen_id,
             progress=:progress, status=:status WHERE id=:id'
        );
        return $stmt->execute([
            ':nama'     => $data['nama'],
            ':tema'     => $data['tema'],
            ':dosen_id' => $data['dosen_id'] ?? null,
            ':progress' => $data['progress'] ?? 0,
            ':status'   => $data['status'] ?? 'aktif',
            ':id'       => $id,
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare('DELETE FROM kelompok WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
