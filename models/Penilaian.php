<?php
/* =============================================
   SMPM — Model: Penilaian
   ============================================= */

require_once __DIR__ . '/../config/database.php';

class Penilaian {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll(): array {
        return $this->db->query(
            'SELECT p.*, k.nama AS kelompok_nama, u.nama AS dosen_nama
             FROM penilaian p
             LEFT JOIN kelompok k ON p.kelompok_id = k.id
             LEFT JOIN users u ON p.dosen_id = u.id
             ORDER BY p.kelompok_id'
        )->fetchAll();
    }

    public function getByKelompok(int $kelompokId): array|false {
        $stmt = $this->db->prepare(
            'SELECT p.*, u.nama AS dosen_nama
             FROM penilaian p
             LEFT JOIN users u ON p.dosen_id = u.id
             WHERE p.kelompok_id = ? LIMIT 1'
        );
        $stmt->execute([$kelompokId]);
        return $stmt->fetch();
    }

    public function upsert(array $data): bool {
        $stmt = $this->db->prepare(
            'INSERT INTO penilaian (kelompok_id, dosen_id, nilai, feedback)
             VALUES (:kelompok_id, :dosen_id, :nilai, :feedback)
             ON DUPLICATE KEY UPDATE nilai=:nilai, feedback=:feedback, updated_at=NOW()'
        );
        return $stmt->execute([
            ':kelompok_id' => $data['kelompok_id'],
            ':dosen_id'    => $data['dosen_id'],
            ':nilai'       => $data['nilai'],
            ':feedback'    => $data['feedback'] ?? null,
        ]);
    }
}
