<?php
/* =============================================
   SMPM — Auto Migration
   Dipanggil dari index.php setiap request,
   hanya eksekusi jika tabel belum ada.
   ============================================= */

function runMigrations(PDO $pdo): void {
    // Cek apakah tabel 'users' sudah ada — kalau sudah, skip semua
    try {
        $pdo->query('SELECT 1 FROM users LIMIT 1');
        return; // Sudah ada, tidak perlu migrate
    } catch (PDOException $e) {
        // Tabel belum ada, lanjut
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

    // ---- TABLE: users ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama        VARCHAR(100)  NOT NULL,
        nim         VARCHAR(20)   NOT NULL UNIQUE,
        email       VARCHAR(100)  NOT NULL UNIQUE,
        password    VARCHAR(255)  NOT NULL,
        role        ENUM('mahasiswa','dosen','admin') NOT NULL DEFAULT 'mahasiswa',
        avatar      VARCHAR(10)   DEFAULT NULL,
        kelompok_id INT UNSIGNED  DEFAULT NULL,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- TABLE: kelompok ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS kelompok (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama        VARCHAR(50)   NOT NULL,
        tema        VARCHAR(200)  NOT NULL,
        dosen_id    INT UNSIGNED  DEFAULT NULL,
        progress    TINYINT UNSIGNED DEFAULT 0,
        status      ENUM('aktif','nonaktif','selesai') DEFAULT 'aktif',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- TABLE: tugas ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS tugas (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        judul       VARCHAR(200)  NOT NULL,
        deskripsi   TEXT          DEFAULT NULL,
        kelompok_id INT UNSIGNED  NOT NULL,
        assignee_id INT UNSIGNED  DEFAULT NULL,
        deadline    DATE          NOT NULL,
        status      ENUM('pending','proses','selesai','terlambat') DEFAULT 'pending',
        created_by  INT UNSIGNED  DEFAULT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- TABLE: uploads ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS uploads (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama_file   VARCHAR(255)  NOT NULL,
        path_file   VARCHAR(500)  NOT NULL,
        ukuran      INT UNSIGNED  NOT NULL,
        tipe        VARCHAR(20)   DEFAULT NULL,
        kelompok_id INT UNSIGNED  NOT NULL,
        user_id     INT UNSIGNED  NOT NULL,
        tugas_id    INT UNSIGNED  DEFAULT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- TABLE: penilaian ----
    $pdo->exec("CREATE TABLE IF NOT EXISTS penilaian (
        id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        kelompok_id INT UNSIGNED  NOT NULL,
        dosen_id    INT UNSIGNED  NOT NULL,
        nilai       TINYINT UNSIGNED DEFAULT NULL,
        feedback    TEXT          DEFAULT NULL,
        dinilai_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_penilaian (kelompok_id, dosen_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // ---- Foreign Keys (wrapped try/catch agar tidak error jika sudah ada) ----
    $fks = [
        'ALTER TABLE kelompok  ADD CONSTRAINT fk_kel_dosen FOREIGN KEY (dosen_id)    REFERENCES users(id)    ON DELETE SET NULL',
        'ALTER TABLE tugas     ADD CONSTRAINT fk_tugas_kel FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE',
        'ALTER TABLE tugas     ADD CONSTRAINT fk_tugas_asn FOREIGN KEY (assignee_id) REFERENCES users(id)    ON DELETE SET NULL',
        'ALTER TABLE tugas     ADD CONSTRAINT fk_tugas_cb  FOREIGN KEY (created_by)  REFERENCES users(id)    ON DELETE SET NULL',
        'ALTER TABLE uploads   ADD CONSTRAINT fk_upl_kel   FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE',
        'ALTER TABLE uploads   ADD CONSTRAINT fk_upl_usr   FOREIGN KEY (user_id)     REFERENCES users(id)    ON DELETE CASCADE',
        'ALTER TABLE uploads   ADD CONSTRAINT fk_upl_tgs   FOREIGN KEY (tugas_id)    REFERENCES tugas(id)    ON DELETE SET NULL',
        'ALTER TABLE penilaian ADD CONSTRAINT fk_pnl_kel   FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE',
        'ALTER TABLE penilaian ADD CONSTRAINT fk_pnl_dsn   FOREIGN KEY (dosen_id)    REFERENCES users(id)    ON DELETE CASCADE',
    ];
    foreach ($fks as $sql) {
        try { $pdo->exec($sql); } catch (PDOException $e) { /* sudah ada, skip */ }
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

    // ---- SEED DATA ----
    // Generate hash PHP native untuk password 'password123'
    $hash = password_hash('password123', PASSWORD_BCRYPT);

    $stmtUser = $pdo->prepare(
        'INSERT IGNORE INTO users (id, nama, nim, email, password, role, avatar, kelompok_id) VALUES (?,?,?,?,?,?,?,?)'
    );
    foreach ([
        [1, 'Putri Novia Sari',  '2021001', 'putri@kampus.ac.id',      $hash, 'mahasiswa', 'PN', 9],
        [2, 'Intan Nuraeni',     '2021002', 'intan@kampus.ac.id',      $hash, 'mahasiswa', 'IN', 10],
        [3, 'Neng Nuraeni',      '2021003', 'neng@kampus.ac.id',       $hash, 'mahasiswa', 'NN', 9],
        [4, 'Dzurrahman Roki Muhammad Ibrahim M.Kom', 'D001', 'dzurrahman@kampus.ac.id', $hash, 'dosen', 'DR', null],
        [5, 'Administrator',     'ADM001',  'admin@kampus.ac.id',      $hash, 'admin',     'AD', null],
    ] as $row) {
        $stmtUser->execute($row);
    }

    $stmtKel = $pdo->prepare(
        'INSERT IGNORE INTO kelompok (id, nama, tema, dosen_id, progress, status) VALUES (?,?,?,?,?,?)'
    );
    foreach ([
        [9,  'Kelompok 09', 'Pengembangan Sistem Informasi Berbasis Web (RPL Lanjut)', 4, 65, 'aktif'],
        [10, 'Kelompok 10', 'Implementasi Design Pattern dalam Aplikasi Enterprise',   4, 85, 'aktif'],
        [11, 'Kelompok 11', 'Pengujian Perangkat Lunak dengan Metode Agile',           4, 25, 'aktif'],
        [12, 'Kelompok 12', 'Rekayasa Kebutuhan dan Pemodelan UML Lanjutan',           4, 10, 'aktif'],
    ] as $row) {
        $stmtKel->execute($row);
    }

    $stmtTgs = $pdo->prepare(
        'INSERT IGNORE INTO tugas (id, judul, kelompok_id, assignee_id, deadline, status, created_by) VALUES (?,?,?,?,?,?,?)'
    );
    foreach ([
        [1, 'Pembuatan Dokumen SRS (Software Requirement Specification)', 9,  1, '2026-04-20', 'proses',    4],
        [2, 'Pemodelan Use Case Diagram UML',                             9,  3, '2026-04-18', 'selesai',   4],
        [3, 'Analisis Kebutuhan Fungsional & Non-Fungsional',             9,  1, '2026-04-10', 'terlambat', 4],
        [4, 'Pembuatan Class Diagram dan Sequence Diagram',               9,  3, '2026-04-15', 'selesai',   4],
        [5, 'Implementasi Design Pattern MVC pada Sistem',                10, 2, '2026-04-22', 'selesai',   4],
        [6, 'Pengujian Unit Testing dengan Framework JUnit',              10, 2, '2026-04-25', 'proses',    4],
        [7, 'Pembuatan Activity Diagram untuk Alur Bisnis',               9,  1, '2026-04-28', 'pending',   4],
        [8, 'Review dan Validasi Dokumen Perancangan Sistem',             10, 2, '2026-04-30', 'pending',   4],
    ] as $row) {
        $stmtTgs->execute($row);
    }

    $stmtNlai = $pdo->prepare(
        'INSERT IGNORE INTO penilaian (id, kelompok_id, dosen_id, nilai, feedback) VALUES (?,?,?,?,?)'
    );
    foreach ([
        [1, 9,  4, 85, 'Dokumen SRS lengkap dan terstruktur. Use Case dan Class Diagram sudah baik.'],
        [2, 10, 4, 90, 'Implementasi MVC sangat baik dan clean. Lanjutkan dengan unit testing.'],
        [3, 11, 4, null, null],
        [4, 12, 4, null, null],
    ] as $row) {
        $stmtNlai->execute($row);
    }
}
