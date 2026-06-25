<?php
/* =============================================
   SMPM — Model: Tugas
   ============================================= */

require_once __DIR__ . '/../config/database.php';

class Tugas {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getByKelompok(int $kelompokId): array {
        $stmt = $this->db->prepare(
            'SELECT t.*, u.nama AS assignee_nama
             FROM tugas t
             LEFT JOIN users u ON t.assignee_id = u.id
             WHERE t.kelompok_id = ?
             ORDER BY t.deadline ASC'
        );
        $stmt->execute([$kelompokId]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT t.*, u.nama AS assignee_nama, k.nama AS kelompok_nama
             FROM tugas t
             LEFT JOIN users u ON t.assignee_id = u.id
             LEFT JOIN kelompok k ON t.kelompok_id = k.id
             WHERE t.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getAllWithKelompok(): array {
        return $this->db->query(
            'SELECT t.*, u.nama AS assignee_nama, k.nama AS kelompok_nama
             FROM tugas t
             LEFT JOIN users u ON t.assignee_id = u.id
             LEFT JOIN kelompok k ON t.kelompok_id = k.id
             ORDER BY t.deadline ASC'
        )->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO tugas (judul, deskripsi, kelompok_id, assignee_id, deadline, status, created_by)
             VALUES (:judul, :deskripsi, :kelompok_id, :assignee_id, :deadline, :status, :created_by)'
        );
        $stmt->execute([
            ':judul'       => $data['judul'],
            ':deskripsi'   => $data['deskripsi'] ?? null,
            ':kelompok_id' => $data['kelompok_id'],
            ':assignee_id' => $data['assignee_id'] ?? null,
            ':deadline'    => $data['deadline'],
            ':status'      => $data['status'] ?? 'pending',
            ':created_by'  => $data['created_by'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool {
        $allowed = ['pending', 'proses', 'selesai', 'terlambat'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare('UPDATE tugas SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }

    public function update(int $id, array $data): bool {
        $stmt = $this->db->prepare(
            'UPDATE tugas SET judul=:judul, deskripsi=:deskripsi, kelompok_id=:kelompok_id,
             assignee_id=:assignee_id, deadline=:deadline, status=:status WHERE id=:id'
        );
        return $stmt->execute([
            ':judul'       => $data['judul'],
            ':deskripsi'   => $data['deskripsi'] ?? null,
            ':kelompok_id' => $data['kelompok_id'],
            ':assignee_id' => $data['assignee_id'] ?? null,
            ':deadline'    => $data['deadline'],
            ':status'      => $data['status'] ?? 'pending',
            ':id'          => $id,
        ]);
    }

    public function delete(int $id): bool {
        $stmt = $this->db->prepare('DELETE FROM tugas WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
