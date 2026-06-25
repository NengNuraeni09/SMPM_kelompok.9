# SMPM — Sistem Manajemen Proyek Mahasiswa

Sistem manajemen proyek berbasis web untuk mahasiswa, dosen, dan admin.  
Tampilan identik dengan versi asli — backend PHP MVC terhubung via `api.php`.

---

## 🚀 Cara Deploy ke Railway (5 menit)

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "SMPM - ready to deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/smpm.git
git push -u origin main
```

### 2. Deploy di Railway
1. Buka [railway.app](https://railway.app) → login GitHub
2. **New Project** → **Deploy from GitHub repo** → pilih repo SMPM
3. Railway otomatis deploy (±2 menit)

### 3. Tambah MySQL
1. Di project Railway → **+ New** → **Database** → **MySQL**
2. Klik service PHP → tab **Variables** → pastikan ada `MYSQLHOST`, dll
3. Klik **Redeploy**

> Saat pertama dibuka, sistem **otomatis buat semua tabel + data demo**.  
> Tidak perlu jalankan SQL manual.

### 4. Buka URL
Railway akan beri URL seperti `smpm-xxx.up.railway.app`

---

## 🔑 Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kampus.ac.id | password |
| Dosen | dzurrahman@kampus.ac.id | password |
| Mahasiswa | putri@kampus.ac.id | password |

---

## 💻 Jalankan Lokal (Laragon)

1. Copy folder ke `C:\laragon\www\SMPM\`
2. Start Laragon → Start All
3. Buka `http://localhost/SMPM`
4. Tabel otomatis dibuat saat pertama diakses

---

## 🏗 Struktur File

```
SMPM/
├── index.php        ← Entry (serve index.html + inject session)
├── api.php          ← Backend API (JSON endpoint)
├── index.html       ← Tampilan asli (tidak diubah)
├── config/
│   ├── database.php ← Koneksi PDO (Railway + lokal)
│   └── migrate.php  ← Auto-create tabel + seed data
├── js/
│   ├── app.js       ← Frontend asli (tidak diubah)
│   └── backend.js   ← Override: hubungkan app.js ke api.php
├── css/style.css
├── uploads/         ← File tugas yang diupload
├── nixpacks.toml    ← Config PHP untuk Railway
└── Procfile         ← Start command Railway
```

---

Kelompok 09 · Studi Kasus Pemrograman Web
