-- ============================================================
--  SMPM — Database Init Script (Railway / Production)
--  Jalankan sekali saat setup database pertama kali
--  CATATAN: Tidak pakai CREATE DATABASE / USE karena
--           Railway sudah menyediakan database otomatis
-- ============================================================

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(100)  NOT NULL,
  nim         VARCHAR(20)   NOT NULL UNIQUE,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL COMMENT 'Bcrypt hash',
  role        ENUM('mahasiswa','dosen','admin') NOT NULL DEFAULT 'mahasiswa',
  avatar      VARCHAR(10)   DEFAULT NULL,
  kelompok_id INT UNSIGNED  DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: kelompok
-- ============================================================
CREATE TABLE IF NOT EXISTS kelompok (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(50)   NOT NULL,
  tema        VARCHAR(200)  NOT NULL,
  dosen_id    INT UNSIGNED  DEFAULT NULL,
  progress    TINYINT UNSIGNED DEFAULT 0,
  status      ENUM('aktif','nonaktif','selesai') DEFAULT 'aktif',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dosen_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: tugas
-- ============================================================
CREATE TABLE IF NOT EXISTS tugas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  judul       VARCHAR(200)  NOT NULL,
  deskripsi   TEXT          DEFAULT NULL,
  kelompok_id INT UNSIGNED  NOT NULL,
  assignee_id INT UNSIGNED  DEFAULT NULL,
  deadline    DATE          NOT NULL,
  status      ENUM('pending','proses','selesai','terlambat') DEFAULT 'pending',
  created_by  INT UNSIGNED  DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kelompok_id)  REFERENCES kelompok(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: uploads
-- ============================================================
CREATE TABLE IF NOT EXISTS uploads (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_file   VARCHAR(255)  NOT NULL,
  path_file   VARCHAR(500)  NOT NULL,
  ukuran      INT UNSIGNED  NOT NULL,
  tipe        VARCHAR(20)   DEFAULT NULL,
  kelompok_id INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  tugas_id    INT UNSIGNED  DEFAULT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (tugas_id)    REFERENCES tugas(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: penilaian
-- ============================================================
CREATE TABLE IF NOT EXISTS penilaian (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kelompok_id INT UNSIGNED  NOT NULL,
  dosen_id    INT UNSIGNED  NOT NULL,
  nilai       TINYINT UNSIGNED DEFAULT NULL,
  feedback    TEXT          DEFAULT NULL,
  dinilai_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_penilaian (kelompok_id, dosen_id),
  FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE,
  FOREIGN KEY (dosen_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- password = 'password' (bcrypt hash)
-- ============================================================
INSERT IGNORE INTO users (id, nama, nim, email, password, role, avatar, kelompok_id) VALUES
  (1, 'Putri Novia Sari',  '2021001', 'putri@kampus.ac.id',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'PN', 9),
  (2, 'Intan Nuraeni',     '2021002', 'intan@kampus.ac.id',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'IN', 10),
  (3, 'Neng Nuraeni',      '2021003', 'neng@kampus.ac.id',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mahasiswa', 'NN', 9),
  (4, 'Dzurrahman Roki Muhammad Ibrahim M.Kom', 'D001', 'dzurrahman@kampus.ac.id',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dosen', 'DR', NULL),
  (5, 'Administrator',     'ADM001',  'admin@kampus.ac.id',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'AD', NULL);

INSERT IGNORE INTO kelompok (id, nama, tema, dosen_id, progress, status) VALUES
  (9,  'Kelompok 09', 'Pengembangan Sistem Informasi Berbasis Web (RPL Lanjut)', 4, 65, 'aktif'),
  (10, 'Kelompok 10', 'Implementasi Design Pattern dalam Aplikasi Enterprise',   4, 85, 'aktif'),
  (11, 'Kelompok 11', 'Pengujian Perangkat Lunak dengan Metode Agile',           4, 25, 'aktif'),
  (12, 'Kelompok 12', 'Rekayasa Kebutuhan dan Pemodelan UML Lanjutan',           4, 10, 'aktif');

INSERT IGNORE INTO tugas (id, judul, kelompok_id, assignee_id, deadline, status, created_by) VALUES
  (1, 'Pembuatan Dokumen SRS (Software Requirement Specification)', 9,  1, '2026-04-20', 'proses',    4),
  (2, 'Pemodelan Use Case Diagram UML',                             9,  3, '2026-04-18', 'selesai',   4),
  (3, 'Analisis Kebutuhan Fungsional & Non-Fungsional',             9,  1, '2026-04-10', 'terlambat', 4),
  (4, 'Pembuatan Class Diagram dan Sequence Diagram',               9,  3, '2026-04-15', 'selesai',   4),
  (5, 'Implementasi Design Pattern MVC pada Sistem',                10, 2, '2026-04-22', 'selesai',   4),
  (6, 'Pengujian Unit Testing dengan Framework JUnit',              10, 2, '2026-04-25', 'proses',    4),
  (7, 'Pembuatan Activity Diagram untuk Alur Bisnis',               9,  1, '2026-04-28', 'pending',   4),
  (8, 'Review dan Validasi Dokumen Perancangan Sistem',             10, 2, '2026-04-30', 'pending',   4);

INSERT IGNORE INTO penilaian (id, kelompok_id, dosen_id, nilai, feedback) VALUES
  (1, 9,  4, 85, 'Dokumen SRS lengkap dan terstruktur. Use Case dan Class Diagram sudah baik.'),
  (2, 10, 4, 90, 'Implementasi MVC sangat baik dan clean. Lanjutkan dengan unit testing.'),
  (3, 11, 4, NULL, NULL),
  (4, 12, 4, NULL, NULL);
