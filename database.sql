-- ============================================================
--  SMPM — Sistem Manajemen Proyek Mahasiswa
--  Database Schema MySQL
--  Kelompok 09
-- ============================================================

CREATE DATABASE IF NOT EXISTS SMPM
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SMPM;

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
  avatar      VARCHAR(10)   DEFAULT NULL COMMENT 'Initials e.g. AF',
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
  progress    TINYINT UNSIGNED DEFAULT 0 COMMENT '0-100 percent',
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
  assignee_id INT UNSIGNED  DEFAULT NULL COMMENT 'User yang ditugaskan',
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
  ukuran      INT UNSIGNED  NOT NULL COMMENT 'Bytes',
  tipe        VARCHAR(20)   DEFAULT NULL COMMENT 'pdf, docx, png, etc',
  kelompok_id INT UNSIGNED  NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  tugas_id    INT UNSIGNED  DEFAULT NULL COMMENT 'Opsional: terkait tugas tertentu',
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
  nilai       TINYINT UNSIGNED DEFAULT NULL COMMENT '0-100',
  feedback    TEXT          DEFAULT NULL,
  dinilai_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_penilaian (kelompok_id, dosen_id),
  FOREIGN KEY (kelompok_id) REFERENCES kelompok(id) ON DELETE CASCADE,
  FOREIGN KEY (dosen_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: notifikasi
-- ============================================================
CREATE TABLE IF NOT EXISTS notifikasi (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  pesan       TEXT          NOT NULL,
  tipe        ENUM('info','success','warning','danger') DEFAULT 'info',
  is_read     TINYINT(1)    DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA — Demo Users (password: "123456" hashed)
-- Gunakan password_hash('123456', PASSWORD_BCRYPT) di PHP
-- Di sini pakai plaintext untuk kemudahan demo
-- ============================================================
INSERT INTO users (nama, nim, email, password, role, avatar, kelompok_id) VALUES
  ('Putri Novia Sari',  '2021001', 'putri@kampus.ac.id',      '$2y$10$demo_hash_replace_me', 'mahasiswa', 'PN', 9),
  ('Intan Nuraeni',     '2021002', 'intan@kampus.ac.id',      '$2y$10$demo_hash_replace_me', 'mahasiswa', 'IN', 10),
  ('Neng Nuraeni',      '2021003', 'neng@kampus.ac.id',       '$2y$10$demo_hash_replace_me', 'mahasiswa', 'NN', 9),
  ('Dzurrahman Roki Muhammad Ibrahim M.Kom', 'D001', 'dzurrahman@kampus.ac.id', '$2y$10$demo_hash_replace_me', 'dosen', 'DR', NULL),
  ('Administrator',     'ADM001',  'admin@kampus.ac.id',      '$2y$10$demo_hash_replace_me', 'admin',     'AD', NULL);

INSERT INTO kelompok (id, nama, tema, dosen_id, progress, status) VALUES
  (9,  'Kelompok 09', 'Pengembangan Sistem Informasi Berbasis Web (RPL Lanjut)', 4, 65, 'aktif'),
  (10, 'Kelompok 10', 'Implementasi Design Pattern dalam Aplikasi Enterprise',   4, 85, 'aktif'),
  (11, 'Kelompok 11', 'Pengujian Perangkat Lunak dengan Metode Agile',           4, 25, 'aktif'),
  (12, 'Kelompok 12', 'Rekayasa Kebutuhan dan Pemodelan UML Lanjutan',           4, 10, 'aktif');

INSERT INTO tugas (judul, kelompok_id, assignee_id, deadline, status, created_by) VALUES
  ('Pembuatan Dokumen SRS (Software Requirement Specification)', 9,  1, '2026-04-20', 'proses',    4),
  ('Pemodelan Use Case Diagram UML',                             9,  3, '2026-04-18', 'selesai',   4),
  ('Analisis Kebutuhan Fungsional & Non-Fungsional',             9,  1, '2026-04-10', 'terlambat', 4),
  ('Pembuatan Class Diagram dan Sequence Diagram',               9,  3, '2026-04-15', 'selesai',   4),
  ('Implementasi Design Pattern MVC pada Sistem',                10, 2, '2026-04-22', 'selesai',   4),
  ('Pengujian Unit Testing dengan Framework JUnit',              10, 2, '2026-04-25', 'proses',    4),
  ('Pembuatan Activity Diagram untuk Alur Bisnis',               9,  1, '2026-04-28', 'pending',   4),
  ('Review dan Validasi Dokumen Perancangan Sistem',             10, 2, '2026-04-30', 'pending',   4);

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Semua tugas per kelompok:
-- SELECT t.*, u.nama AS assignee FROM tugas t
-- LEFT JOIN users u ON t.assignee_id = u.id
-- WHERE t.kelompok_id = 9 ORDER BY t.deadline ASC;

-- Progress semua kelompok (untuk monitoring dosen):
-- SELECT k.nama, k.tema, k.progress,
--        COUNT(t.id) AS total_tugas,
--        SUM(t.status='selesai') AS tugas_selesai
-- FROM kelompok k
-- LEFT JOIN tugas t ON t.kelompok_id = k.id
-- GROUP BY k.id ORDER BY k.id;

-- Upload terbaru:
-- SELECT u.nama_file, u.uploaded_at, usr.nama AS uploader, k.nama AS kelompok
-- FROM uploads u
-- JOIN users usr ON u.user_id = usr.id
-- JOIN kelompok k ON u.kelompok_id = k.id
-- ORDER BY u.uploaded_at DESC LIMIT 10;
