# SMPM — Sistem Manajemen Proyek Mahasiswa

Aplikasi manajemen proyek berbasis web untuk mahasiswa, dosen, dan admin.  
Dibangun dengan **PHP MVC** murni (tanpa framework), MySQL, HTML/CSS/JS.

---

## 🚀 Deploy ke Railway

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/SMPM.git
git push -u origin main
```

### 2. Buat project di Railway
1. Buka [railway.app](https://railway.app) → Login
2. Klik **"New Project"** → **"Deploy from GitHub repo"**
3. Pilih repo SMPM kamu
4. Railway otomatis deteksi PHP dan deploy

### 3. Tambahkan MySQL Plugin
1. Di Railway project → klik **"+ New"** → **"Database"** → **"MySQL"**
2. Railway otomatis inject env variables:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`

### 4. Inisialisasi Database
Setelah deploy, buka URL:
```
https://nama-app.up.railway.app/setup.php?token=smpm_setup_2024
```
Ini akan membuat tabel dan seed data demo.

> ⚠️ Setelah setup berhasil, hapus `setup.php` dari repository!

### 5. Akun Demo
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kampus.ac.id | password |
| Dosen | dzurrahman@kampus.ac.id | password |
| Mahasiswa | putri@kampus.ac.id | password |

---

## 💻 Jalankan Lokal (Laragon)

1. Copy folder `SMPM` ke `C:\laragon\www\`
2. Buka Laragon → Start All
3. Import `init.sql` ke HeidiSQL / phpMyAdmin
4. Buka `http://smpm.test` atau `http://localhost/SMPM`

---

## 🏗 Struktur MVC

```
SMPM/
├── index.php              ← Front Controller
├── config/
│   └── database.php       ← Koneksi DB (auto-detect Railway env)
├── models/                ← Data layer (PDO)
├── controllers/           ← Business logic
├── views/                 ← Template PHP
│   ├── layout/            ← Header, sidebar, footer
│   ├── auth/              ← Login
│   ├── dashboard/         ← Dashboard per role
│   ├── tugas/             ← Halaman tugas
│   └── admin/             ← Halaman admin
├── css/style.css
├── js/app.js
└── uploads/               ← File upload user
```

---

## 📋 Teknologi

- **Backend**: PHP 8.1+ (MVC, PDO, bcrypt)
- **Database**: MySQL 8
- **Frontend**: Vanilla JS, CSS custom (no framework)
- **Deploy**: Railway + GitHub

---

Kelompok 09 · Studi Kasus Pemrograman Web
