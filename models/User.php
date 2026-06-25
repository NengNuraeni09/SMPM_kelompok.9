<?php
/* =============================================
   SMPM — Model: User
   ============================================= */

require_once __DIR__ . '/../config/database.php';

class User {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /** Cari user berdasarkan email (untuk login) */
    public function findByEmail(string $email): array|false {
        $stmt = $this->db->prepare(
            'SELECT id, nama, nim, email, password, role, avatar, kelompok_id
             FROM users WHERE email = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    /** Cari user berdasarkan ID */
    public function findById(int $id): array|false {
        $stmt = $this->db->prepare(
            'SELECT id, nama, nim, email, role, avatar, kelompok_id
             FROM users WHERE id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /** Semua user (untuk admin) */
    public function getAll(): array {
        return $this->db->query(
            'SELECT id, nama, nim, email, role, avatar, kelompok_id, created_at
             FROM users ORDER BY role, nama'
        )->fetchAll();
    }

    /** Buat user baru */
    public function create(array $data): int {
        $stmt = $this->db->prepare(
            'INSERT INTO users (nama, nim, email, password, role, avatar, kelompok_id)
             VALUES (:nama, :nim, :email, :password, :role, :avatar, :kelompok_id)'
        );
        $stmt->execute([
            ':nama'        => $data['nama'],
            ':nim'         => $data['nim'],
            ':email'       => $data['email'],
            ':password'    => password_hash($data['password'], PASSWORD_BCRYPT),
            ':role'        => $data['role'] ?? 'mahasiswa',
            ':avatar'      => $data['avatar'] ?? strtoupper(substr($data['nama'], 0, 2)),
            ':kelompok_id' => $data['kelompok_id'] ?? null,
        ]);
        return (int) $this->db->lastInsertId();
    }

    /** Update user */
    public function update(int $id, array $data): bool {
        $fields = [];
        $params = [];
        $allowed = ['nama', 'nim', 'email', 'role', 'avatar', 'kelompok_id'];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = :$f";
                $params[":$f"] = $data[$f];
            }
        }
        if (isset($data['password'])) {
            $fields[] = 'password = :password';
            $params[':password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        if (empty($fields)) return false;
        $params[':id'] = $id;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id');
        return $stmt->execute($params);
    }

    /** Hapus user */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        return $stmt->execute([$id]);
    }

    /** Cek email sudah ada */
    public function emailExists(string $email, int $excludeId = 0): bool {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $excludeId]);
        return (bool) $stmt->fetchColumn();
    }
}
