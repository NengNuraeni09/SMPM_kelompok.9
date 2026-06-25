/* =============================================
   SMPM — Sistem Manajemen Proyek Mahasiswa
   app.js — Main Application Logic
   ============================================= */

'use strict';

/* ---- MOCK DATABASE (replace with real API calls) ---- */
const DB = {
  users: [
    { id: 1, nama: 'Putri Novia Sari',  nim: '2021001', email: 'putri@kampus.ac.id',  password: '123456', role: 'mahasiswa', kelompok_id: 9,  avatar: 'PN' },
    { id: 2, nama: 'Intan Nuraeni',     nim: '2021002', email: 'intan@kampus.ac.id',  password: '123456', role: 'mahasiswa', kelompok_id: 10, avatar: 'IN' },
    { id: 5, nama: 'Neng Nuraeni',      nim: '2021003', email: 'neng@kampus.ac.id',   password: '123456', role: 'mahasiswa', kelompok_id: 9,  avatar: 'NN' },
    { id: 3, nama: 'Dzurrahman Roki Muhammad Ibrahim M.Kom', nim: 'D001', email: 'dzurrahman@kampus.ac.id', password: '123456', role: 'dosen', kelompok_id: null, avatar: 'DR' },
    { id: 4, nama: 'Administrator',     nim: 'ADM',     email: 'admin@kampus.ac.id',  password: 'admin',  role: 'admin',     kelompok_id: null, avatar: 'AD' },
  ],
  kelompok: [
    { id: 9,  nama: 'Kelompok 09', tema: 'Pengembangan Sistem Informasi Berbasis Web (RPL Lanjut)', dosen_id: 3, progress: 65,  status: 'aktif' },
    { id: 10, nama: 'Kelompok 10', tema: 'Implementasi Design Pattern dalam Aplikasi Enterprise',   dosen_id: 3, progress: 85,  status: 'aktif' },
    { id: 11, nama: 'Kelompok 11', tema: 'Pengujian Perangkat Lunak dengan Metode Agile',           dosen_id: 3, progress: 25,  status: 'aktif' },
    { id: 12, nama: 'Kelompok 12', tema: 'Rekayasa Kebutuhan dan Pemodelan UML Lanjutan',           dosen_id: 3, progress: 10,  status: 'aktif' },
  ],
  tugas: [
    { id: 1, judul: 'Pembuatan Dokumen SRS (Software Requirement Specification)', kelompok_id: 9,  assignee: 1, deadline: '2026-04-20', status: 'proses',    file: null,          created: '2026-04-01' },
    { id: 2, judul: 'Pemodelan Use Case Diagram UML',                             kelompok_id: 9,  assignee: 5, deadline: '2026-04-18', status: 'selesai',   file: 'usecase.pdf', created: '2026-04-01' },
    { id: 3, judul: 'Analisis Kebutuhan Fungsional & Non-Fungsional',             kelompok_id: 9,  assignee: 1, deadline: '2026-04-10', status: 'terlambat', file: null,          created: '2026-04-01' },
    { id: 4, judul: 'Pembuatan Class Diagram dan Sequence Diagram',               kelompok_id: 9,  assignee: 5, deadline: '2026-04-15', status: 'selesai',   file: 'classdiagram.pdf', created: '2026-04-02' },
    { id: 5, judul: 'Implementasi Design Pattern MVC pada Sistem',                kelompok_id: 10, assignee: 2, deadline: '2026-04-22', status: 'selesai',   file: 'mvc_impl.zip', created: '2026-04-02' },
    { id: 6, judul: 'Pengujian Unit Testing dengan Framework JUnit',              kelompok_id: 10, assignee: 2, deadline: '2026-04-25', status: 'proses',    file: null,          created: '2026-04-03' },
    { id: 7, judul: 'Pembuatan Activity Diagram untuk Alur Bisnis',               kelompok_id: 9,  assignee: 1, deadline: '2026-04-28', status: 'pending',   file: null,          created: '2026-04-05' },
    { id: 8, judul: 'Review dan Validasi Dokumen Perancangan Sistem',             kelompok_id: 10, assignee: 2, deadline: '2026-04-30', status: 'pending',   file: null,          created: '2026-04-06' },
  ],
  uploads: [
    { id: 1, nama_file: 'usecase_diagram.pdf',    kelompok_id: 9,  tugas_id: 2, user_id: 5, tanggal: '2026-04-16 10:30', ukuran: '312 KB',  tipe: 'PDF',  dataUrl: null },
    { id: 2, nama_file: 'mvc_implementation.zip', kelompok_id: 10, tugas_id: 5, user_id: 2, tanggal: '2026-04-15 14:20', ukuran: '2.4 MB',  tipe: 'ZIP',  dataUrl: null },
    { id: 3, nama_file: 'class_diagram_v2.pdf',   kelompok_id: 9,  tugas_id: 4, user_id: 1, tanggal: '2026-04-14 09:00', ukuran: '210 KB',  tipe: 'PDF',  dataUrl: null },
  ],
  penilaian: [
    { id: 1, kelompok_id: 9,  dosen_id: 3, nilai: 85, feedback: 'Dokumen SRS lengkap dan terstruktur. Use Case dan Class Diagram sudah baik. Pertahankan konsistensi pemodelan UML pada tahap berikutnya.', tanggal: '2026-04-16' },
    { id: 2, kelompok_id: 10, dosen_id: 3, nilai: 90, feedback: 'Implementasi MVC sangat baik dan clean. Struktur kode rapi dan mudah dipahami. Lanjutkan dengan unit testing yang komprehensif.', tanggal: '2026-04-16' },
    { id: 3, kelompok_id: 11, dosen_id: 3, nilai: null, feedback: null, tanggal: null },
    { id: 4, kelompok_id: 12, dosen_id: 3, nilai: null, feedback: null, tanggal: null },
  ],
};

/* ---- SESSION ---- */
let currentUser = null;

function login(email, password) {
  // Cari user berdasarkan email dan password
  const user = DB.users.find(u => u.email === email && u.password === password);
  
  if (!user) return false;
  currentUser = user;
  sessionStorage.setItem('smpm_user', JSON.stringify(user));
  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('smpm_user');
  showPage('login');
}

function checkSession() {
  const saved = sessionStorage.getItem('smpm_user');
  if (saved) {
    const sessionUser = JSON.parse(saved);
    // Selalu sync dengan data terbaru dari DB agar kelompok_id tidak stale
    const freshUser = DB.users.find(u => u.id === sessionUser.id);
    currentUser = freshUser || sessionUser;
    return true;
  }
  return false;
}

/* ---- ROUTER ---- */
const pages = ['login', 'dashboard', 'tugas', 'deadline', 'upload', 'kelompok', 'nilaiSaya', 'tugasDosen', 'monitoring', 'penilaian', 'manageUser', 'manageKelompok'];

function showPage(name) {
  // Access control check
  if (name !== 'login' && !hasAccessPage(name)) {
    showToast('Anda tidak memiliki akses ke halaman ini!', 'error');
    return;
  }

  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById('page-' + name);
  if (target) target.classList.remove('hidden');

  const isLoginPage = name === 'login';
  const sidebar = document.getElementById('sidebar');
  const topbar  = document.getElementById('topbar');
  const mainContent = document.getElementById('main-content');
  if (sidebar) sidebar.classList.toggle('hidden', isLoginPage);
  if (topbar)  topbar.classList.toggle('hidden', isLoginPage);
  if (mainContent) {
    mainContent.style.marginLeft = isLoginPage ? '0' : '';
  }

  if (!isLoginPage) {
    updateSidebarActive(name);
    document.getElementById('topbar-title').textContent = getPageTitle(name);
    renderPage(name);
  }
}

function getPageTitle(name) {
  const titles = {
    dashboard: 'Dashboard', tugas: 'Tugas Saya', deadline: 'Deadline Tracking',
    upload: 'Upload Progress', kelompok: 'Kelompok Saya', nilaiSaya: 'Nilai Saya',
    tugasDosen: 'Tugas Kelompok',
    monitoring: 'Monitoring Kelompok', penilaian: 'Penilaian',
    manageUser: 'Kelola Pengguna', manageKelompok: 'Kelola Kelompok',
  };
  return titles[name] || name;
}

function updateSidebarActive(name) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });
}

/* ---- RENDER PAGES ---- */
function renderPage(name) {
  const renders = {
    dashboard:       renderDashboard,
    tugas:           renderTugas,
    deadline:        renderDeadline,
    upload:          renderUpload,
    kelompok:        renderKelompok,
    nilaiSaya:       renderNilaiSaya,
    tugasDosen:      renderTugasDosen,
    monitoring:      renderMonitoring,
    penilaian:       renderPenilaian,
    manageUser:      renderManageUser,
    manageKelompok:  renderManageKelompok,
  };
  if (renders[name]) renders[name]();
}

/* ---- DASHBOARD ---- */
function renderDashboard() {
  if (!currentUser) return;
  const role = currentUser.role;

  if (role === 'mahasiswa') {
    const myTugas = DB.tugas.filter(t => t.kelompok_id === currentUser.kelompok_id);
    const selesai  = myTugas.filter(t => t.status === 'selesai').length;
    const proses   = myTugas.filter(t => t.status === 'proses').length;
    const terlambat = myTugas.filter(t => t.status === 'terlambat').length;
    const pending = myTugas.filter(t => t.status === 'pending').length;
    const kelompok = DB.kelompok.find(k => k.id === currentUser.kelompok_id);
    const recentTugas = myTugas.slice(0, 4);
    
    // Calculate completion percentage
    const completionRate = myTugas.length > 0 ? Math.round((selesai / myTugas.length) * 100) : 0;

    document.getElementById('dash-welcome').textContent = `Ringkasan aktivitas proyek Anda hari ini. Completion rate: ${completionRate}%`;
    
    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Tugas</div><div class="stat-value">${myTugas.length}</div></div>
      <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-value" style="color:var(--success)">${selesai}</div></div>
      <div class="stat-card"><div class="stat-label">Sedang Proses</div><div class="stat-value" style="color:var(--accent)">${proses}</div></div>
      <div class="stat-card"><div class="stat-label">Terlambat</div><div class="stat-value" style="color:var(--danger)">${terlambat}</div></div>
    `;
    
    document.getElementById('dash-progress').innerHTML = kelompok ? `
      <div class="card mt-16">
        <div class="card-title">Progress ${kelompok.nama}</div>
        <div class="flex items-center gap-16 mb-8">
          <div style="flex:1"><div class="text-sm text-muted mb-4">${kelompok.tema}</div></div>
          <span style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;color:var(--accent)">${kelompok.progress}%</span>
        </div>
        <div class="progress-wrap"><div class="progress-fill progress-blue" style="width:${kelompok.progress}%"></div></div>
        
        <!-- Task Completion Chart -->
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border)">
          <div class="text-sm font-600 mb-12">📊 Statistik Penyelesaian Tugas Anda</div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
            <div style="text-align:center">
              <div style="width:60px;height:60px;border-radius:50%;background:conic-gradient(var(--success) ${completionRate * 3.6}deg, var(--border) 0);margin:0 auto 8px;display:flex;align-items:center;justify-content:center">
                <div style="width:45px;height:45px;border-radius:50%;background:var(--white);display:flex;align-items:center;justify-content:center">
                  <span style="font-size:.75rem;font-weight:700">${completionRate}%</span>
                </div>
              </div>
              <div class="text-xs text-muted">Completion</div>
            </div>
            <div style="background:var(--success-lt);padding:12px;border-radius:var(--radius-md)">
              <div class="text-lg font-700" style="color:var(--success)">${selesai}</div>
              <div class="text-xs text-muted">Selesai</div>
            </div>
            <div style="background:var(--accent-lt);padding:12px;border-radius:var(--radius-md)">
              <div class="text-lg font-700" style="color:var(--accent)">${proses}</div>
              <div class="text-xs text-muted">Proses</div>
            </div>
            <div style="background:var(--warning-lt);padding:12px;border-radius:var(--radius-md)">
              <div class="text-lg font-700" style="color:var(--warning)">${pending}</div>
              <div class="text-xs text-muted">Pending</div>
            </div>
            <div style="background:var(--danger-lt);padding:12px;border-radius:var(--radius-md)">
              <div class="text-lg font-700" style="color:var(--danger)">${terlambat}</div>
              <div class="text-xs text-muted">Terlambat</div>
            </div>
          </div>
        </div>
      </div>
    ` : '';
    
    document.getElementById('dash-recent').innerHTML = `
      <div class="card mt-16">
        <div class="card-title">Tugas Terbaru</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Judul Tugas</th><th>Deadline</th><th>Status</th></tr></thead>
            <tbody>${recentTugas.map(t => `
              <tr>
                <td>${t.judul}</td>
                <td>${formatDate(t.deadline)}</td>
                <td>${statusBadge(t.status)}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (role === 'dosen') {
    const kelompokList = DB.kelompok;
    const onTrack = kelompokList.filter(k => k.progress >= 50).length;
    const perhatian = kelompokList.filter(k => k.progress < 50).length;
    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Kelompok</div><div class="stat-value">${kelompokList.length}</div></div>
      <div class="stat-card"><div class="stat-label">On Track</div><div class="stat-value" style="color:var(--success)">${onTrack}</div></div>
      <div class="stat-card"><div class="stat-label">Perlu Perhatian</div><div class="stat-value" style="color:var(--danger)">${perhatian}</div></div>
      <div class="stat-card"><div class="stat-label">Total Upload</div><div class="stat-value">${DB.uploads.length}</div></div>
    `;
    document.getElementById('dash-progress').innerHTML = '';
    document.getElementById('dash-recent').innerHTML = `
      <div class="card mt-16">
        <div class="flex justify-between items-center mb-16" style="flex-wrap:wrap;gap:8px">
          <div class="card-title" style="margin:0">Status Semua Kelompok</div>
          <button class="btn btn-primary btn-sm" onclick="showPage('tugasDosen')" style="display:flex;align-items:center;gap:6px;font-size:.82rem">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Tugas
          </button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Kelompok</th><th>Tema Proyek</th><th>Progress</th><th></th></tr></thead>
            <tbody>${kelompokList.map(k => `
              <tr>
                <td><strong>${k.nama}</strong></td>
                <td class="text-muted text-sm">${k.tema}</td>
                <td style="min-width:160px">
                  <div class="flex items-center gap-8">
                    <div class="progress-wrap" style="flex:1"><div class="progress-fill ${progressColor(k.progress)}" style="width:${k.progress}%"></div></div>
                    <span class="text-sm font-600">${k.progress}%</span>
                  </div>
                </td>
                <td>${progressBadge(k.progress)}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (role === 'admin') {
    const totalMhs = DB.users.filter(u => u.role === 'mahasiswa').length;
    const totalDosen = DB.users.filter(u => u.role === 'dosen').length;
    document.getElementById('dash-stats').innerHTML = `
      <div class="stat-card"><div class="stat-label">Mahasiswa</div><div class="stat-value">${totalMhs}</div></div>
      <div class="stat-card"><div class="stat-label">Dosen</div><div class="stat-value">${totalDosen}</div></div>
      <div class="stat-card"><div class="stat-label">Kelompok</div><div class="stat-value">${DB.kelompok.length}</div></div>
      <div class="stat-card"><div class="stat-label">Total Upload</div><div class="stat-value">${DB.uploads.length}</div></div>
    `;
    document.getElementById('dash-progress').innerHTML = '';
    document.getElementById('dash-recent').innerHTML = `
      <div class="card mt-16">
        <div class="card-title">User Terdaftar</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Nama</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>${DB.users.map(u => `
              <tr>
                <td><div class="flex items-center gap-8"><div class="avatar" style="width:28px;height:28px;font-size:.7rem">${u.avatar}</div>${u.nama}</div></td>
                <td class="text-muted text-sm">${u.email}</td>
                <td>${roleBadge(u.role)}</td>
              </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    `;
  }
}

/* ---- TUGAS ---- */
function renderTugas() {
  if (!currentUser || currentUser.role !== 'mahasiswa') return;
  const myTugas = DB.tugas.filter(t => t.kelompok_id === currentUser.kelompok_id);
  const container = document.getElementById('tugas-list');
  if (!container) return;
  
  let html = '<div class="mb-16" style="display:flex;gap:12px;justify-content:flex-end">';
  html += '<button class="btn btn-primary" onclick="exportTugasAsPDF()" style="display:flex;align-items:center;gap:8px">';
  html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-5 6H7m5 0v3m0-3H9m5-2v-2"/></svg>';
  html += 'Export PDF</button></div>';
  
  if (myTugas.length === 0) {
    html += `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg><p>Belum ada tugas</p></div>`;
    container.innerHTML = html;
    return;
  }

  html += myTugas.map(t => {
    const myUploads = DB.uploads.filter(u => u.tugas_id === t.id);
    return `
    <div class="card mb-8" style="border-left:4px solid ${statusColor(t.status)}">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
        <div style="flex:1;min-width:180px">
          <div class="font-600">${t.judul}</div>
          <div class="text-sm text-muted mt-4">Deadline: ${formatDate(t.deadline)}</div>
          ${t.submitted_at ? `<div class="text-sm mt-4" style="color:var(--success)">✓ Dikumpulkan: ${formatDate(t.submitted_at)}</div>` : ''}
        </div>
        <div class="flex gap-8 items-center" style="flex-wrap:wrap">
          ${statusBadge(t.status)}
          ${myUploads.map(u => `<span class="badge badge-navy" style="cursor:pointer;font-size:.72rem" onclick="lihatFileTugas(${u.id})" title="Klik untuk lihat file">📎 ${u.nama_file}</span>`).join('')}
          ${t.status !== 'selesai'
            ? `<button class="btn btn-sm btn-success" onclick="showKumpulkanModal(${t.id})" style="display:flex;align-items:center;gap:5px">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Kumpulkan
               </button>`
            : `<button class="btn btn-sm btn-outline" onclick="showKumpulkanModal(${t.id})" style="font-size:.75rem;display:flex;align-items:center;gap:5px">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Upload Lagi
               </button>`
          }
        </div>
      </div>
    </div>`;
  }).join('');
  container.innerHTML = html;
}

/* Modal kumpulkan tugas + upload file */
function showKumpulkanModal(tugasId) {
  const t = DB.tugas.find(x => x.id === tugasId);
  if (!t) return;
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const existing = DB.uploads.filter(u => u.tugas_id === tugasId);

  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Kumpulkan Tugas</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--surface);border-radius:var(--radius-md);padding:12px 14px;border-left:3px solid var(--accent)">
        <div style="font-size:.78rem;color:var(--text-3);margin-bottom:2px">Tugas</div>
        <div style="font-weight:600">${t.judul}</div>
        <div style="font-size:.8rem;color:var(--text-3);margin-top:3px">Deadline: ${formatDate(t.deadline)}</div>
      </div>

      ${existing.length > 0 ? `
      <div>
        <div style="font-size:.8rem;font-weight:600;color:var(--text-2);margin-bottom:8px">File Sebelumnya</div>
        ${existing.map(u => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border);margin-bottom:6px">
            <div class="flex items-center gap-10">
              <div style="width:30px;height:30px;background:var(--accent-lt);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--accent)">${u.tipe}</div>
              <div>
                <div style="font-size:.82rem;font-weight:600">${u.nama_file}</div>
                <div style="font-size:.72rem;color:var(--text-3)">${u.ukuran} · ${u.tanggal}</div>
              </div>
            </div>
            <div class="flex gap-6">
              <button class="btn btn-sm btn-outline" onclick="lihatFileTugas(${u.id})" style="font-size:.72rem">👁 Lihat</button>
              <button class="btn btn-sm" style="background:transparent;color:var(--danger);font-size:.75rem;padding:4px 8px" onclick="hapusUploadTugas(${u.id},${tugasId})">✕</button>
            </div>
          </div>`).join('')}
      </div>` : ''}

      <div class="form-group">
        <label class="form-label">Upload File Tugas <span style="color:var(--danger)">*</span></label>
        <div id="drop-zone-${tugasId}"
          style="border:2px dashed var(--border);border-radius:var(--radius-md);padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:var(--surface)"
          onclick="document.getElementById('file-kumpulkan-${tugasId}').click()"
          ondragover="event.preventDefault();this.style.borderColor='var(--accent)';this.style.background='var(--accent-lt)'"
          ondragleave="this.style.borderColor='var(--border)';this.style.background='var(--surface)'"
          ondrop="handleDropKumpulkan(event,${tugasId})">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-3);margin:0 auto 8px;display:block"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <div style="font-size:.85rem;font-weight:600;color:var(--text-2)">Klik atau drag file ke sini</div>
          <div style="font-size:.75rem;color:var(--text-3);margin-top:4px">PDF, DOC, DOCX, ZIP, PNG, JPG (maks. 10 MB)</div>
          <input type="file" id="file-kumpulkan-${tugasId}" style="display:none"
            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
            onchange="previewFileKumpulkan(this,${tugasId})" />
        </div>
        <div id="preview-kumpulkan-${tugasId}" style="display:none;margin-top:8px;padding:10px 14px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border)">
          <div class="flex items-center justify-between gap-10">
            <div class="flex items-center gap-10">
              <div id="icon-kumpulkan-${tugasId}" style="width:32px;height:32px;background:var(--accent-lt);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--accent)">—</div>
              <div>
                <div id="name-kumpulkan-${tugasId}" style="font-size:.85rem;font-weight:600"></div>
                <div id="size-kumpulkan-${tugasId}" style="font-size:.72rem;color:var(--text-3)"></div>
              </div>
            </div>
            <button onclick="clearFileKumpulkan(${tugasId})" style="background:none;border:none;cursor:pointer;color:var(--text-3);font-size:1rem">✕</button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Catatan untuk Dosen (opsional)</label>
        <textarea class="form-control" id="catatan-kumpulkan-${tugasId}" rows="2"
          placeholder="Tuliskan catatan atau keterangan pengerjaan..." style="resize:vertical"></textarea>
      </div>

      <button class="btn btn-primary w-full" onclick="submitKumpulkan(${tugasId})"
        style="justify-content:center;padding:12px;display:flex;align-items:center;gap:8px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        Kumpulkan Tugas
      </button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function previewFileKumpulkan(input, tugasId) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const ext  = file.name.split('.').pop().toUpperCase();
  document.getElementById(`preview-kumpulkan-${tugasId}`).style.display = 'block';
  document.getElementById(`name-kumpulkan-${tugasId}`).textContent = file.name;
  document.getElementById(`size-kumpulkan-${tugasId}`).textContent  = (file.size / 1024).toFixed(0) + ' KB';
  document.getElementById(`icon-kumpulkan-${tugasId}`).textContent  = ext;
  const dz = document.getElementById(`drop-zone-${tugasId}`);
  if (dz) { dz.style.borderColor = 'var(--success)'; dz.style.background = '#f0fdf4'; }
}

function clearFileKumpulkan(tugasId) {
  const inp = document.getElementById(`file-kumpulkan-${tugasId}`);
  if (inp) inp.value = '';
  document.getElementById(`preview-kumpulkan-${tugasId}`).style.display = 'none';
  const dz = document.getElementById(`drop-zone-${tugasId}`);
  if (dz) { dz.style.borderColor = 'var(--border)'; dz.style.background = 'var(--surface)'; }
}

function handleDropKumpulkan(event, tugasId) {
  event.preventDefault();
  const dz  = document.getElementById(`drop-zone-${tugasId}`);
  const inp = document.getElementById(`file-kumpulkan-${tugasId}`);
  if (dz) { dz.style.borderColor = 'var(--border)'; dz.style.background = 'var(--surface)'; }
  if (!event.dataTransfer.files.length) return;
  const dt = new DataTransfer();
  dt.items.add(event.dataTransfer.files[0]);
  inp.files = dt.files;
  previewFileKumpulkan(inp, tugasId);
}

function submitKumpulkan(tugasId) {
  const inp = document.getElementById(`file-kumpulkan-${tugasId}`);
  if (!inp || !inp.files || !inp.files.length) {
    showToast('Pilih file terlebih dahulu!', 'error'); return;
  }
  const file    = inp.files[0];
  const ext     = file.name.split('.').pop().toUpperCase();
  const catatan = document.getElementById(`catatan-kumpulkan-${tugasId}`)?.value.trim() || null;

  const reader = new FileReader();
  reader.onload = function(e) {
    const newUpload = {
      id:          Date.now(),
      nama_file:   file.name,
      kelompok_id: currentUser.kelompok_id,
      tugas_id:    tugasId,
      user_id:     currentUser.id,
      tanggal:     new Date().toLocaleString('id-ID'),
      ukuran:      file.size >= 1024 * 1024
                     ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                     : (file.size / 1024).toFixed(0) + ' KB',
      tipe:        ext,
      dataUrl:     e.target.result,
      catatan:     catatan,
    };
    DB.uploads.push(newUpload);

    // Mark tugas selesai
    const t = DB.tugas.find(x => x.id === tugasId);
    if (t) {
      t.status       = 'selesai';
      t.file         = file.name;
      t.submitted_at = new Date().toISOString().split('T')[0];
    }

    closeModal();
    renderTugas();
    showToast(`Tugas berhasil dikumpulkan! File "${file.name}" diunggah.`, 'success');
  };
  reader.readAsDataURL(file);
}

function hapusUploadTugas(uploadId, tugasId) {
  const idx = DB.uploads.findIndex(u => u.id === uploadId);
  if (idx > -1) DB.uploads.splice(idx, 1);
  showKumpulkanModal(tugasId);
}

function selesaikanTugas(id) {
  showKumpulkanModal(id);
}

/* ---- LIHAT FILE TUGAS (dosen & mahasiswa) ---- */
function lihatFileTugas(uploadId) {
  const u = DB.uploads.find(x => x.id === uploadId);
  if (!u) { showToast('File tidak ditemukan', 'error'); return; }

  const overlay  = document.getElementById('modal-overlay');
  const body     = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const uploader = DB.users.find(x => x.id === u.user_id);
  const kelompok = DB.kelompok.find(x => x.id === u.kelompok_id);
  const tugas    = u.tugas_id ? DB.tugas.find(x => x.id === u.tugas_id) : null;

  const isImage = ['PNG','JPG','JPEG','GIF','SVG','WEBP'].includes(u.tipe);
  const isPdf   = u.tipe === 'PDF';

  /* preview area */
  let previewHtml = '';
  if (u.dataUrl) {
    if (isImage) {
      previewHtml = `
        <div style="margin:12px 0;text-align:center;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;background:var(--surface);padding:8px">
          <img src="${u.dataUrl}" alt="${u.nama_file}"
            style="max-width:100%;max-height:440px;object-fit:contain;border-radius:var(--radius-md)" />
        </div>`;
    } else if (isPdf) {
      previewHtml = `
        <div style="margin:12px 0;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;height:480px">
          <iframe src="${u.dataUrl}" style="width:100%;height:100%;border:none" title="${u.nama_file}"></iframe>
        </div>`;
    }
  }

  /* fallback when no real file (mock data) */
  if (!previewHtml) {
    const icon = isPdf ? '📄' : isImage ? '🖼️' : u.tipe === 'ZIP' ? '📦'
               : (u.tipe === 'DOC' || u.tipe === 'DOCX') ? '📝' : '📁';
    previewHtml = `
      <div style="margin:12px 0;border:2px dashed var(--border);border-radius:var(--radius-md);padding:40px 20px;text-align:center;background:var(--surface)">
        <div style="font-size:3.5rem;margin-bottom:10px">${icon}</div>
        <div style="font-weight:600;color:var(--text-2);margin-bottom:6px">${u.nama_file}</div>
        <div style="font-size:.82rem;color:var(--text-3)">
          File demo — preview tidak tersedia.<br>
          Pada sistem nyata, file ini dapat dibuka dan diunduh langsung.
        </div>
      </div>`;
  }

  body.style.maxWidth = '700px';
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title" style="display:flex;align-items:center;gap:8px;word-break:break-all">
        ${isPdf ? '📄' : isImage ? '🖼️' : u.tipe==='ZIP' ? '📦' : '📁'}
        <span style="flex:1">${u.nama_file}</span>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="max-height:85vh;overflow-y:auto">

      <!-- Meta info -->
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:4px">
        <div style="flex:1;min-width:150px;padding:10px 14px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="font-size:.72rem;color:var(--text-3);margin-bottom:4px">Dikirim oleh</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="avatar" style="width:26px;height:26px;font-size:.6rem">${uploader ? uploader.avatar : '?'}</div>
            <div>
              <div style="font-size:.85rem;font-weight:600">${uploader ? uploader.nama : '-'}</div>
              <div style="font-size:.72rem;color:var(--text-3)">${uploader ? uploader.nim : ''}</div>
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:130px;padding:10px 14px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="font-size:.72rem;color:var(--text-3);margin-bottom:4px">Kelompok</div>
          <div style="font-size:.85rem;font-weight:600">${kelompok ? kelompok.nama : '-'}</div>
        </div>
        <div style="flex:1;min-width:130px;padding:10px 14px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border)">
          <div style="font-size:.72rem;color:var(--text-3);margin-bottom:4px">Waktu upload</div>
          <div style="font-size:.85rem;font-weight:600">${u.tanggal}</div>
          <div style="font-size:.72rem;color:var(--text-3)">${u.ukuran}</div>
        </div>
      </div>

      ${tugas ? `
      <div style="padding:10px 14px;background:var(--surface);border-radius:var(--radius-md);border-left:3px solid var(--accent);margin-bottom:4px">
        <div style="font-size:.72rem;color:var(--text-3);margin-bottom:2px">Untuk tugas</div>
        <div style="font-size:.88rem;font-weight:600">${tugas.judul}</div>
        <div style="font-size:.75rem;color:var(--text-3);margin-top:2px">
          Deadline: ${formatDate(tugas.deadline)} &nbsp;·&nbsp; ${statusBadge(tugas.status)}
        </div>
      </div>` : ''}

      ${u.catatan ? `
      <div style="padding:10px 14px;background:#fffbeb;border-radius:var(--radius-md);border:1px solid #fde68a;margin-bottom:4px">
        <div style="font-size:.72rem;font-weight:600;color:#92400e;margin-bottom:3px">💬 Catatan mahasiswa</div>
        <div style="font-size:.85rem;color:#78350f">${u.catatan}</div>
      </div>` : ''}

      ${previewHtml}

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;margin-top:12px">
        ${u.dataUrl
          ? `<a href="${u.dataUrl}" download="${u.nama_file}" class="btn btn-primary"
               style="flex:1;justify-content:center;display:flex;align-items:center;gap:6px">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
               Unduh File
             </a>`
          : `<button class="btn btn-primary" style="flex:1;justify-content:center;opacity:.5;cursor:not-allowed" disabled>
               Unduh (demo)
             </button>`}
        <button class="btn btn-outline" onclick="closeModal()" style="flex:1;justify-content:center">Tutup</button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

/* ---- DEADLINE ---- */
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function renderDeadline() {
  renderCalendar();
  renderDeadlineList();
}

function renderCalendar() {
  const myTugas = DB.tugas.filter(t => t.kelompok_id === currentUser.kelompok_id);
  const container = document.getElementById('deadline-calendar');
  if (!container) return;
  
  const today = new Date();
  const year = currentCalendarYear;
  const month = currentCalendarMonth;
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                     'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  // Day names
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  // Create task map for quick lookup
  const taskMap = {};
  myTugas.forEach(t => {
    const dl = new Date(t.deadline);
    const dateKey = `${dl.getFullYear()}-${dl.getMonth()}-${dl.getDate()}`;
    if (!taskMap[dateKey]) taskMap[dateKey] = [];
    taskMap[dateKey].push(t);
  });
  
  // Build calendar HTML - ULTRA COMPACT MINI WIDGET
  let html = `
    <div style="margin-bottom:4px">
      <div class="flex justify-between items-center">
        <button class="btn btn-sm btn-outline" onclick="changeCalendarMonth(-1)" style="display:flex;align-items:center;gap:1px;padding:1px 3px;font-size:.6rem">
          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style="font-size:.65rem;font-weight:700">${monthNames[month]} ${year}</div>
        <button class="btn btn-sm btn-outline" onclick="changeCalendarMonth(1)" style="display:flex;align-items:center;gap:1px;padding:1px 3px;font-size:.6rem">
          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">
      ${dayNames.map(d => `<div style="text-align:center;font-size:.45rem;font-weight:600;color:var(--text-3);padding:1px 0">${d}</div>`).join('')}
  `;
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += `<div style="height:28px"></div>`;
  }
  
  // Days of month - ULTRA COMPACT MINI
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const tasks = taskMap[dateKey] || [];
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    
    const hasDeadline = tasks.length > 0;
    const hasOverdue = tasks.some(t => t.status !== 'selesai' && new Date(t.deadline) < today);
    const hasPending = tasks.some(t => t.status !== 'selesai');
    
    let bgColor = isToday ? 'var(--accent)' : 'transparent';
    let textColor = isToday ? 'white' : 'inherit';
    let borderColor = 'var(--border)';
    
    if (hasDeadline && !isToday) {
      if (hasOverdue) {
        borderColor = 'var(--danger)';
        bgColor = 'var(--danger-lt)';
      } else if (hasPending) {
        borderColor = 'var(--warning)';
        bgColor = 'var(--warning-lt)';
      }
    }
    
    html += `
      <div style="
        height:28px;
        border:1px solid ${borderColor};
        border-radius:2px;
        padding:0;
        background:${bgColor};
        color:${textColor};
        cursor:${hasDeadline ? 'pointer' : 'default'};
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        ${hasDeadline ? 'font-weight:700;' : ''}
      " ${hasDeadline ? `onclick="showCalendarTasks('${dateKey}')"` : ''}>
        <div style="font-size:.45rem;line-height:1">${day}</div>
        ${tasks.length > 0 ? `<div style="font-size:.35rem;margin-top:-1px;line-height:1">${tasks.length}</div>` : ''}
      </div>
    `;
  }
  
  html += '</div>';
  
  container.innerHTML = html;
}

function changeCalendarMonth(delta) {
  currentCalendarMonth += delta;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  } else if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderDeadline();
}

function showCalendarTasks(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const myTugas = DB.tugas.filter(t => {
    const dl = new Date(t.deadline);
    return dl.getFullYear() === year && dl.getMonth() === month && dl.getDate() === day;
  });
  
  if (myTugas.length === 0) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.style.maxWidth = '600px';
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">📅 Tugas pada ${day}/${month + 1}/${year}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${myTugas.map(t => `
        <div style="background:var(--surface);padding:16px;border-radius:var(--radius-md);border-left:4px solid ${statusColor(t.status)}">
          <div class="text-sm font-700 mb-8">${t.judul}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <div class="text-xs text-muted">
              📅 Deadline: ${formatDate(t.deadline)}<br>
              👤 Ditugaskan ke: ${DB.users.find(u => u.id === t.assignee)?.nama || 'Tidak ada'}
            </div>
            ${statusBadge(t.status)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  overlay.classList.remove('hidden');
}

function renderDeadlineList() {
  const myTugas = DB.tugas
    .filter(t => t.kelompok_id === currentUser.kelompok_id)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const container = document.getElementById('deadline-list');
  if (!container) return;
  const today = new Date();
  container.innerHTML = myTugas.map(t => {
    const dl = new Date(t.deadline);
    const diff = Math.ceil((dl - today) / 86400000);
    const urgency = diff < 0 ? 'Terlambat' : diff === 0 ? 'Hari ini!' : `${diff} hari lagi`;
    const urgencyColor = diff < 0 ? 'var(--danger)' : diff <= 3 ? 'var(--warning)' : 'var(--success)';
    return `
      <div class="mb-8" style="padding:16px;background:var(--surface);border-radius:var(--radius-md);border-left:4px solid ${urgencyColor}">
        <div class="flex justify-between items-center">
          <div style="flex:1">
            <div class="font-600">${t.judul}</div>
            <div class="text-sm text-muted mt-4">📅 ${formatDate(t.deadline)}</div>
          </div>
          <div class="flex gap-8 items-center">
            <span style="font-size:.82rem;font-weight:700;color:${urgencyColor}">${urgency}</span>
            ${statusBadge(t.status)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* ---- UPLOAD ---- */
function renderUpload() {
  const myUploads = DB.uploads.filter(u => u.kelompok_id === currentUser.kelompok_id);
  const container = document.getElementById('upload-list');
  if (!container) return;
  
  // Populate task dropdown
  const tugasSelect = document.getElementById('upload-tugas');
  if (tugasSelect) {
    const myTugas = DB.tugas.filter(t => 
      t.kelompok_id === currentUser.kelompok_id && 
      t.assignee === currentUser.id &&
      t.status !== 'selesai'
    );
    
    tugasSelect.innerHTML = `
      <option value="">-- Pilih Tugas yang Ingin Diupload --</option>
      ${myTugas.map(t => `<option value="${t.id}">${t.judul} (Deadline: ${formatDate(t.deadline)})</option>`).join('')}
    `;
  }
  
  container.innerHTML = myUploads.map(u => {
    const tugasInfo = u.tugas_id ? DB.tugas.find(t => t.id === u.tugas_id) : null;
    return `
    <div class="card mb-8">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-12">
          <div style="width:40px;height:40px;background:var(--accent-lt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--accent)">${u.tipe}</div>
          <div style="flex:1">
            <div class="font-600">${u.nama_file}</div>
            <div class="text-sm text-muted">${u.tanggal} · ${u.ukuran}</div>
            ${tugasInfo ? `<div class="text-xs" style="color:var(--accent);margin-top:4px">📝 ${tugasInfo.judul}</div>` : ''}
          </div>
        </div>
        <div class="flex gap-8">
          <button class="btn btn-outline btn-sm" onclick="lihatFileTugas(${u.id})">👁 Lihat</button>
          <button class="btn btn-danger btn-sm" onclick="hapusUpload(${u.id})">🗑 Hapus</button>
        </div>
      </div>
    </div>
  `;
  }).join('') || '<div class="empty-state"><p>Belum ada file yang diunggah</p></div>';
}

function handleUpload() {
  const tugasSelect = document.getElementById('upload-tugas');
  const input = document.getElementById('upload-input');
  
  if (!tugasSelect || !tugasSelect.value) { 
    showToast('Pilih tugas terlebih dahulu!', 'error'); 
    return; 
  }
  
  if (!input || !input.files.length) { 
    showToast('Pilih file terlebih dahulu', 'error'); 
    return; 
  }
  
  const file    = input.files[0];
  const tugasId = parseInt(tugasSelect.value);

  const reader = new FileReader();
  reader.onload = function(e) {
    const newUpload = {
      id:          Date.now(),
      nama_file:   file.name,
      kelompok_id: currentUser.kelompok_id,
      user_id:     currentUser.id,
      tugas_id:    tugasId,
      tanggal:     new Date().toLocaleString('id-ID'),
      ukuran:      file.size >= 1024 * 1024
                     ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                     : (file.size / 1024).toFixed(0) + ' KB',
      tipe:        file.name.split('.').pop().toUpperCase(),
      dataUrl:     e.target.result,
      catatan:     null,
    };
    DB.uploads.push(newUpload);

    // Auto-mark tugas selesai
    const tugas = DB.tugas.find(t => t.id === tugasId);
    if (tugas && tugas.status !== 'selesai') {
      tugas.status       = 'selesai';
      tugas.file         = file.name;
      tugas.submitted_at = new Date().toISOString().split('T')[0];
      showToast(`🎉 File berhasil diupload! Tugas "${tugas.judul}" otomatis selesai.`, 'success');
    } else {
      showToast(`File "${file.name}" berhasil diunggah!`, 'success');
    }

    input.value = '';
    tugasSelect.value = '';
    renderUpload();
  };
  reader.readAsDataURL(file);
}

function hapusUpload(uploadId) {
  const upload = DB.uploads.find(u => u.id === uploadId);
  if (!upload) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Konfirmasi Hapus File</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="text-align:center;padding:20px 0">
      <div style="width:64px;height:64px;background:var(--danger-lt);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p style="font-size:1rem;font-weight:600;margin-bottom:8px">Hapus File Ini?</p>
      <p style="font-size:.875rem;color:var(--text-3);margin-bottom:16px">${upload.nama_file}</p>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline w-full" onclick="closeModal()" style="justify-content:center">Batal</button>
      <button class="btn btn-danger w-full" onclick="konfirmasiHapusUpload(${upload.id})" style="justify-content:center">Ya, Hapus</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function konfirmasiHapusUpload(uploadId) {
  const index = DB.uploads.findIndex(u => u.id === uploadId);
  if (index > -1) {
    DB.uploads.splice(index, 1);
  }
  closeModal();
  renderUpload();
  showToast('File berhasil dihapus!', 'success');
}

/* ---- KELOMPOK ---- */
function renderKelompok() {
  const kelompok = DB.kelompok.find(k => k.id === currentUser.kelompok_id);
  const container = document.getElementById('kelompok-detail');
  if (!container) return;
  if (!kelompok) { container.innerHTML = '<div class="empty-state"><p>Anda belum masuk kelompok</p></div>'; return; }
  const anggota = DB.users.filter(u => u.kelompok_id === kelompok.id);
  const dosen = DB.users.find(u => u.id === kelompok.dosen_id);
  container.innerHTML = `
    <div class="card mb-16">
      <div class="card-title">${kelompok.nama}</div>
      <div class="text-muted mb-16">${kelompok.tema}</div>
      <div class="flex items-center gap-12 mb-8">
        <span class="text-sm text-muted">Progress:</span>
        <div class="progress-wrap" style="flex:1"><div class="progress-fill progress-blue" style="width:${kelompok.progress}%"></div></div>
        <span class="font-600">${kelompok.progress}%</span>
      </div>
    </div>
    <div class="card mb-16">
      <div class="card-title">Dosen Pembimbing</div>
      ${dosen ? `<div class="flex items-center gap-12"><div class="avatar avatar-lg">${dosen.avatar}</div><div><div class="font-600">${dosen.nama}</div><div class="text-sm text-muted">${dosen.email}</div></div></div>` : ''}
    </div>
    <div class="card">
      <div class="card-title">Anggota Kelompok</div>
      ${anggota.map(a => `
        <div class="flex items-center gap-12 mb-8">
          <div class="avatar">${a.avatar}</div>
          <div><div class="font-600">${a.nama}</div><div class="text-sm text-muted">${a.nim} · ${a.email}</div></div>
        </div>`).join('')}
    </div>
  `;
}

/* ---- TUGAS KELOMPOK (Dosen) ---- */
function renderTugasDosen() {
  if (!currentUser || currentUser.role !== 'dosen') return;
  const container = document.getElementById('tugasDosen-list');
  if (!container) return;

  const myKelompok = DB.kelompok.filter(k => k.dosen_id === currentUser.id);
  const kelompokIds = myKelompok.map(k => k.id);
  const allTugas = DB.tugas.filter(t => kelompokIds.includes(t.kelompok_id));

  // Stats
  const selesai   = allTugas.filter(t => t.status === 'selesai').length;
  const proses    = allTugas.filter(t => t.status === 'proses').length;
  const terlambat = allTugas.filter(t => t.status === 'terlambat').length;
  const pending   = allTugas.filter(t => t.status === 'pending').length;

  let html = `
    <div class="stat-grid mb-24">
      <div class="stat-card"><div class="stat-label">Total Tugas</div><div class="stat-value">${allTugas.length}</div></div>
      <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-value" style="color:var(--success)">${selesai}</div></div>
      <div class="stat-card"><div class="stat-label">Sedang Proses</div><div class="stat-value" style="color:var(--accent)">${proses}</div></div>
      <div class="stat-card"><div class="stat-label">Terlambat</div><div class="stat-value" style="color:var(--danger)">${terlambat + pending}</div></div>
    </div>
  `;

  // Per-kelompok section
  myKelompok.forEach(k => {
    const tugasKelompok = DB.tugas.filter(t => t.kelompok_id === k.id);
    const anggota = DB.users.filter(u => u.kelompok_id === k.id && u.role === 'mahasiswa');

    html += `
      <div class="card mb-16">
        <div class="flex justify-between items-center mb-16" style="flex-wrap:wrap;gap:10px">
          <div>
            <div class="card-title" style="margin-bottom:2px">${k.nama}</div>
            <div class="text-sm text-muted">${k.tema}</div>
          </div>
          <button class="btn btn-primary" onclick="showTambahTugasModal(${k.id})" style="display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Tambah Tugas
          </button>
        </div>
        ${tugasKelompok.length === 0
          ? `<div style="text-align:center;padding:24px;color:var(--text-3);font-size:.875rem">Belum ada tugas untuk kelompok ini.</div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr><th>Judul Tugas</th><th>Assignee</th><th>Deadline</th><th>Status</th><th>File</th><th>Aksi</th></tr>
                </thead>
                <tbody id="tugas-rows-${k.id}">
                  ${renderTugasRows(k.id)}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderTugasRows(kelompokId) {
  const tugasList = DB.tugas.filter(t => t.kelompok_id === kelompokId);
  if (tugasList.length === 0) return `<tr><td colspan="6" style="text-align:center;color:var(--text-3)">Belum ada tugas</td></tr>`;
  return tugasList.map(t => {
    const assignee     = DB.users.find(u => u.id === t.assignee);
    const tugasUploads = DB.uploads.filter(u => u.tugas_id === t.id);
    const fileHtml = tugasUploads.length > 0
      ? tugasUploads.map(u => `
          <span class="badge badge-navy"
            style="font-size:.72rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;margin-bottom:2px"
            onclick="lihatFileTugas(${u.id})" title="Klik untuk buka file">
            📎 ${u.nama_file}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </span>`).join('<br>')
      : t.file
        ? `<span class="badge badge-navy" style="font-size:.72rem;opacity:.65" title="File data lama — tidak dapat dibuka">📎 ${t.file}</span>`
        : `<span class="text-muted text-sm" style="font-size:.78rem">Belum dikumpulkan</span>`;

    return `
      <tr>
        <td><span class="font-600">${t.judul}</span></td>
        <td>
          <div class="flex items-center gap-8">
            <div class="avatar" style="width:26px;height:26px;font-size:.65rem">${assignee ? assignee.avatar : '?'}</div>
            <span class="text-sm">${assignee ? assignee.nama : 'Tidak ada'}</span>
          </div>
        </td>
        <td class="text-sm text-muted">${formatDate(t.deadline)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>
          ${fileHtml}
          ${t.submitted_at ? `<div style="font-size:.68rem;color:var(--text-3);margin-top:2px">📅 ${formatDate(t.submitted_at)}</div>` : ''}
        </td>
        <td>
          <div class="flex gap-6">
            <button class="btn btn-sm btn-outline" onclick="showEditTugasModal(${t.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="hapusTugas(${t.id}, ${kelompokId})">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function showTambahTugasModal(kelompokId) {
  const kelompok = DB.kelompok.find(k => k.id === kelompokId);
  const anggota  = DB.users.filter(u => u.kelompok_id === kelompokId && u.role === 'mahasiswa');
  const overlay  = document.getElementById('modal-overlay');
  const body     = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const today = new Date().toISOString().split('T')[0];
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Tambah Tugas — ${kelompok ? kelompok.nama : ''}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Judul Tugas <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="tt-judul" placeholder="Contoh: Buat ERD Database" />
      </div>
      <div class="form-group">
        <label class="form-label">Assignee (Mahasiswa) <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="tt-assignee">
          <option value="">-- Pilih Mahasiswa --</option>
          ${anggota.map(a => `<option value="${a.id}">${a.nama} (${a.nim})</option>`).join('')}
          ${anggota.length === 0 ? '<option disabled>Belum ada anggota di kelompok ini</option>' : ''}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deadline <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="tt-deadline" type="date" min="${today}" value="${today}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status Awal</label>
        <select class="form-control" id="tt-status">
          <option value="pending">Pending</option>
          <option value="proses">Proses</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi / Catatan</label>
        <textarea class="form-control" id="tt-desc" rows="3" placeholder="Instruksi tambahan untuk mahasiswa..." style="resize:vertical"></textarea>
      </div>
      <button class="btn btn-primary w-full" onclick="submitTambahTugas(${kelompokId})" style="justify-content:center;padding:12px;margin-top:4px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px"><path d="M12 5v14M5 12h14"/></svg>
        Simpan Tugas
      </button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function submitTambahTugas(kelompokId) {
  const judul    = document.getElementById('tt-judul')?.value.trim();
  const assignee = document.getElementById('tt-assignee')?.value;
  const deadline = document.getElementById('tt-deadline')?.value;
  const status   = document.getElementById('tt-status')?.value || 'pending';

  if (!judul)    { showToast('Judul tugas wajib diisi!', 'error'); return; }
  if (!assignee) { showToast('Pilih mahasiswa assignee!', 'error'); return; }
  if (!deadline) { showToast('Deadline wajib diisi!', 'error'); return; }

  const newTugas = {
    id:          Date.now(),
    judul,
    kelompok_id: kelompokId,
    assignee:    parseInt(assignee),
    deadline,
    status,
    file:        null,
    created:     new Date().toISOString().split('T')[0],
  };
  DB.tugas.push(newTugas);
  closeModal();
  renderTugasDosen();
  showToast(`Tugas "${judul}" berhasil ditambahkan!`, 'success');
}

function showEditTugasModal(tugasId) {
  const t = DB.tugas.find(x => x.id === tugasId);
  if (!t) return;
  const kelompok = DB.kelompok.find(k => k.id === t.kelompok_id);
  const anggota  = DB.users.filter(u => u.kelompok_id === t.kelompok_id && u.role === 'mahasiswa');
  const overlay  = document.getElementById('modal-overlay');
  const body     = document.getElementById('modal-body');
  if (!overlay || !body) return;

  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Edit Tugas — ${kelompok ? kelompok.nama : ''}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label class="form-label">Judul Tugas <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="et-judul" value="${t.judul}" />
      </div>
      <div class="form-group">
        <label class="form-label">Assignee</label>
        <select class="form-control" id="et-assignee">
          ${anggota.map(a => `<option value="${a.id}" ${a.id === t.assignee ? 'selected' : ''}>${a.nama} (${a.nim})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Deadline</label>
        <input class="form-control" id="et-deadline" type="date" value="${t.deadline}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="et-status">
          <option value="pending"   ${t.status==='pending'   ? 'selected':''}>Pending</option>
          <option value="proses"    ${t.status==='proses'    ? 'selected':''}>Proses</option>
          <option value="selesai"   ${t.status==='selesai'   ? 'selected':''}>Selesai</option>
          <option value="terlambat" ${t.status==='terlambat' ? 'selected':''}>Terlambat</option>
        </select>
      </div>
      <button class="btn btn-primary w-full" onclick="submitEditTugas(${tugasId})" style="justify-content:center;padding:12px;margin-top:4px">Simpan Perubahan</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function submitEditTugas(tugasId) {
  const t = DB.tugas.find(x => x.id === tugasId);
  if (!t) return;
  const judul    = document.getElementById('et-judul')?.value.trim();
  const assignee = document.getElementById('et-assignee')?.value;
  const deadline = document.getElementById('et-deadline')?.value;
  const status   = document.getElementById('et-status')?.value;

  if (!judul) { showToast('Judul tidak boleh kosong!', 'error'); return; }
  t.judul    = judul;
  t.assignee = parseInt(assignee);
  t.deadline = deadline;
  t.status   = status;
  closeModal();
  renderTugasDosen();
  showToast('Tugas berhasil diperbarui!', 'success');
}

function hapusTugas(tugasId, kelompokId) {
  const tugas = DB.tugas.find(t => t.id === tugasId);
  if (!tugas) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Konfirmasi Hapus Tugas</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="text-align:center;padding:20px 0">
      <div style="width:64px;height:64px;background:var(--danger-lt);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p style="font-size:1rem;font-weight:600;margin-bottom:8px">Hapus Tugas Ini?</p>
      <p style="color:var(--text-2);font-size:.875rem;margin-bottom:24px">Anda akan menghapus tugas <strong>"${tugas.judul}"</strong>. Tindakan ini tidak bisa dibatalkan.</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn btn-outline" onclick="closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="confirmHapusTugas(${tugasId}, ${kelompokId})">Ya, Hapus</button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function confirmHapusTugas(tugasId, kelompokId) {
  const idx = DB.tugas.findIndex(t => t.id === tugasId);
  if (idx > -1) DB.tugas.splice(idx, 1);
  closeModal();
  renderTugasDosen();
  showToast('Tugas berhasil dihapus', 'success');
}

/* ---- MONITORING (Dosen) ---- */
function renderMonitoring() {
  if (!currentUser || currentUser.role !== 'dosen') return;
  const container = document.getElementById('monitoring-list');
  if (!container) return;
  const recentUploads = DB.uploads.slice(-3).reverse();
  container.innerHTML = `
    <div class="mb-16" style="display:flex;gap:12px;justify-content:flex-end">
      <button class="btn btn-primary" onclick="exportMonitoringAsPDF()" style="display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-5 6H7m5 0v3m0-3H9m5-2v-2"/></svg>
        Export PDF
      </button>
    </div>
    <div class="stat-grid mb-24">
      <div class="stat-card"><div class="stat-label">Total Kelompok</div><div class="stat-value">${DB.kelompok.length}</div></div>
      <div class="stat-card"><div class="stat-label">On Track (≥50%)</div><div class="stat-value" style="color:var(--success)">${DB.kelompok.filter(k=>k.progress>=50).length}</div></div>
      <div class="stat-card"><div class="stat-label">Perlu Perhatian</div><div class="stat-value" style="color:var(--danger)">${DB.kelompok.filter(k=>k.progress<50).length}</div></div>
      <div class="stat-card"><div class="stat-label">Total Upload</div><div class="stat-value">${DB.uploads.length}</div></div>
    </div>
    <div class="card mb-16">
      <div class="card-title">Progress Semua Kelompok</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Kelompok</th><th>Tema</th><th>Progress</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>${DB.kelompok.map(k => `
            <tr>
              <td><strong>${k.nama}</strong></td>
              <td class="text-sm text-muted">${k.tema}</td>
              <td style="min-width:180px">
                <div class="flex items-center gap-8">
                  <div class="progress-wrap" style="flex:1"><div class="progress-fill ${progressColor(k.progress)}" style="width:${k.progress}%"></div></div>
                  <span class="text-sm font-600">${k.progress}%</span>
                </div>
              </td>
              <td>${progressBadge(k.progress)}</td>
              <td><button class="btn btn-sm btn-outline" onclick="showDetailKelompok(${k.id})">Detail</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Upload Terbaru</div>
      ${recentUploads.map(u => {
        const user = DB.users.find(x => x.id === u.user_id);
        const kelompok = DB.kelompok.find(k => k.id === u.kelompok_id);
        return `
          <div class="flex justify-between items-center mb-8 pb-8" style="border-bottom:1px solid var(--border);cursor:pointer"
            onclick="lihatFileTugas(${u.id})" title="Klik untuk buka file"
            onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='transparent'">
            <div class="flex items-center gap-10">
              <div style="width:32px;height:32px;background:var(--accent-lt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:var(--accent);flex-shrink:0">${u.tipe}</div>
              <div>
                <div class="font-600">${u.nama_file}</div>
                <div class="text-sm text-muted">${kelompok?.nama} · ${user?.nama}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="text-sm text-muted">${u.tanggal}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

/* ---- PENILAIAN (Dosen) ---- */
function showDetailKelompok(kelompokId) {
  const kelompok = DB.kelompok.find(k => k.id === kelompokId);
  if (!kelompok) return;
  
  const anggota = DB.users.filter(u => u.kelompok_id === kelompokId && u.role === 'mahasiswa');
  const tugasList = DB.tugas.filter(t => t.kelompok_id === kelompokId);
  const dosen = DB.users.find(u => u.id === kelompok.dosen_id);
  const penilaian = DB.penilaian.find(p => p.kelompok_id === kelompokId);
  
  // Calculate task statistics
  const tugasSelesai = tugasList.filter(t => t.status === 'selesai').length;
  const tugasProses = tugasList.filter(t => t.status === 'proses').length;
  const tugasPending = tugasList.filter(t => t.status === 'pending').length;
  const tugasTerlambat = tugasList.filter(t => t.status === 'terlambat').length;
  
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.style.maxWidth = '700px';
  
  body.innerHTML = `
    <div class="modal-header" style="position:sticky;top:0;background:var(--white);z-index:10;padding-bottom:12px;border-bottom:1px solid var(--border)">
      <div class="modal-title">Detail ${kelompok.nama}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;padding-top:16px">
      <!-- Info Kelompok -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">Informasi Kelompok</div>
        <div style="display:grid;gap:8px">
          <div class="flex justify-between"><span class="text-sm text-muted">Tema:</span><span class="text-sm font-600">${kelompok.tema}</span></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Dosen Pembimbing:</span><span class="text-sm font-600">${dosen ? dosen.nama : '-'}</span></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Status:</span><span class="badge badge-success">${kelompok.status}</span></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Progress:</span><span class="text-sm font-600" style="color:var(--accent)">${kelompok.progress}%</span></div>
        </div>
        <div class="progress-wrap mt-8"><div class="progress-fill ${progressColor(kelompok.progress)}" style="width:${kelompok.progress}%"></div></div>
      </div>
      
      <!-- Anggota Kelompok -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">Anggota (${anggota.length})</div>
        <div style="display:grid;gap:8px">
          ${anggota.map(a => `
            <div class="flex items-center gap-12" style="padding:8px;background:var(--white);border-radius:var(--radius-md)">
              <div class="avatar" style="width:36px;height:36px;font-size:.8rem">${a.avatar}</div>
              <div style="flex:1">
                <div class="text-sm font-600">${a.nama}</div>
                <div class="text-xs text-muted">${a.nim}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Statistik Tugas -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">Statistik Tugas</div>
        <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);gap:8px">
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Total</div>
            <div class="text-lg font-700">${tugasList.length}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Selesai</div>
            <div class="text-lg font-700" style="color:var(--success)">${tugasSelesai}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Proses</div>
            <div class="text-lg font-700" style="color:var(--accent)">${tugasProses}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Terlambat</div>
            <div class="text-lg font-700" style="color:var(--danger)">${tugasTerlambat}</div>
          </div>
        </div>
      </div>
      
      <!-- Daftar Tugas -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">Daftar Tugas (${tugasList.length})</div>
        ${tugasList.length === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:16px">Belum ada tugas</div>' : `
          <div style="display:grid;gap:8px">
            ${tugasList.map(t => {
              const assignee = DB.users.find(u => u.id === t.assignee);
              const tugasUploads = DB.uploads.filter(u => u.tugas_id === t.id);
              return `
                <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);border-left:4px solid ${statusColor(t.status)}">
                  <div class="text-sm font-600 mb-4">${t.judul}</div>
                  <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:6px">
                    <div class="text-xs text-muted">
                      ${assignee ? assignee.nama : 'Tidak ada'} · ${formatDate(t.deadline)}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                      ${statusBadge(t.status)}
                      ${tugasUploads.map(u => `
                        <span class="badge badge-navy"
                          style="font-size:.68rem;cursor:pointer;display:inline-flex;align-items:center;gap:3px"
                          onclick="lihatFileTugas(${u.id})" title="Klik untuk buka">
                          📎 ${u.nama_file}
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </span>`).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
      
      <!-- Penilaian -->
      ${penilaian ? `
        <div class="card" style="background:var(--surface)">
          <div class="card-title" style="margin-bottom:12px">Penilaian</div>
          ${penilaian.nilai !== null ? `
            <div style="display:grid;gap:8px">
              <div class="flex justify-between">
                <span class="text-sm text-muted">Nilai:</span>
                <span class="text-xl font-700" style="color:var(--accent)">${penilaian.nilai}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-muted">Grade:</span>
                ${penilaian.nilai >= 85 ? '<span class="badge badge-success">A</span>' :
                  penilaian.nilai >= 70 ? '<span class="badge badge-navy">B</span>' :
                  penilaian.nilai >= 55 ? '<span class="badge" style="background:#f59e0b22;color:#d97706">C</span>' :
                  '<span class="badge badge-danger">D</span>'}
              </div>
              ${penilaian.feedback ? `
                <div style="background:var(--white);padding:12px;border-radius:var(--radius-md)">
                  <div class="text-xs text-muted mb-4">Feedback:</div>
                  <div class="text-sm">${penilaian.feedback}</div>
                </div>
              ` : ''}
              <div class="text-xs text-muted">Tanggal: ${formatDate(penilaian.tanggal)}</div>
            </div>
          ` : '<div class="text-sm text-muted" style="text-align:center;padding:16px">Belum ada penilaian</div>'}
        </div>
      ` : ''}
    </div>
  `;
  
  overlay.classList.remove('hidden');
}

function renderPenilaian() {
  const container = document.getElementById('penilaian-list');
  if (!container) return;

  const nilaiGrade = (n) => {
    if (n === null) return '<span class="badge" style="background:var(--border);color:var(--text-3)">Belum Dinilai</span>';
    if (n >= 85) return '<span class="badge badge-success">A</span>';
    if (n >= 70) return '<span class="badge badge-navy">B</span>';
    if (n >= 55) return '<span class="badge" style="background:#f59e0b22;color:#d97706">C</span>';
    return '<span class="badge badge-danger">D</span>';
  };

  container.innerHTML = `
    <div class="card">
      <div class="card-title">Penilaian Kelompok — Mata Kuliah RPL Lanjut</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Kelompok</th><th>Tema</th><th>Progress</th><th>Nilai (0-100)</th><th>Grade</th><th>Feedback</th><th>Aksi</th></tr></thead>
          <tbody>${DB.kelompok.map(k => {
            const p = DB.penilaian.find(x => x.kelompok_id === k.id);
            const nilaiVal = p ? (p.nilai !== null ? p.nilai : '') : '';
            const feedbackVal = p ? (p.feedback || '') : '';
            return `
            <tr>
              <td><strong>${k.nama}</strong></td>
              <td class="text-sm text-muted" style="max-width:180px">${k.tema}</td>
              <td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--border);border-radius:99px"><div style="width:${k.progress}%;height:100%;background:var(--primary);border-radius:99px"></div></div><span class="text-sm">${k.progress}%</span></div></td>
              <td><input type="number" class="form-control" id="nilai-${k.id}" style="width:80px;padding:6px 8px" placeholder="0-100" min="0" max="100" value="${nilaiVal}" /></td>
              <td id="grade-${k.id}">${nilaiGrade(p ? p.nilai : null)}</td>
              <td><textarea class="form-control" id="feedback-${k.id}" rows="2" style="min-width:200px;font-size:.8rem;resize:vertical" placeholder="Tulis feedback untuk kelompok ini...">${feedbackVal}</textarea></td>
              <td><button class="btn btn-sm btn-outline" onclick="showDetailPenilaian(${k.id})" style="margin-right:6px">Detail</button><button class="btn btn-sm btn-primary" onclick="simpanNilai(${k.id})">Simpan</button></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function showDetailPenilaian(kelompokId) {
  const kelompok = DB.kelompok.find(k => k.id === kelompokId);
  if (!kelompok) return;
  
  const penilaian = DB.penilaian.find(p => p.kelompok_id === kelompokId);
  const anggota = DB.users.filter(u => u.kelompok_id === kelompokId && u.role === 'mahasiswa');
  const tugasList = DB.tugas.filter(t => t.kelompok_id === kelompokId);
  const uploads = DB.uploads.filter(u => u.kelompok_id === kelompokId);
  const dosen = DB.users.find(u => u.id === kelompok.dosen_id);
  
  // Calculate statistics
  const tugasSelesai = tugasList.filter(t => t.status === 'selesai').length;
  const tugasProses = tugasList.filter(t => t.status === 'proses').length;
  const tugasPending = tugasList.filter(t => t.status === 'pending').length;
  const tugasTerlambat = tugasList.filter(t => t.status === 'terlambat').length;
  const totalTugas = tugasList.length;
  const completionRate = totalTugas > 0 ? Math.round((tugasSelesai / totalTugas) * 100) : 0;
  
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.style.maxWidth = '800px';
  
  body.innerHTML = `
    <div class="modal-header" style="position:sticky;top:0;background:var(--white);z-index:10;padding-bottom:12px;border-bottom:1px solid var(--border)">
      <div class="modal-title">Detail Penilaian - ${kelompok.nama}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;padding-top:16px">
      
      <!-- Info Kelompok -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">📋 Informasi Kelompok</div>
        <div style="display:grid;gap:10px">
          <div class="flex justify-between">
            <span class="text-sm text-muted">Nama Kelompok:</span>
            <span class="text-sm font-600">${kelompok.nama}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted">Tema Proyek:</span>
            <span class="text-sm font-600" style="max-width:60%;text-align:right">${kelompok.tema}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted">Dosen Pembimbing:</span>
            <span class="text-sm font-600">${dosen ? dosen.nama : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-muted">Status:</span>
            <span class="badge badge-success">${kelompok.status}</span>
          </div>
          <div>
            <div class="flex justify-between mb-4">
              <span class="text-sm text-muted">Progress:</span>
              <span class="text-sm font-700" style="color:var(--accent)">${kelompok.progress}%</span>
            </div>
            <div class="progress-wrap"><div class="progress-fill ${progressColor(kelompok.progress)}" style="width:${kelompok.progress}%"></div></div>
          </div>
        </div>
      </div>
      
      <!-- Anggota Kelompok -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">👥 Anggota Kelompok (${anggota.length})</div>
        ${anggota.length === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:16px">Tidak ada anggota</div>' : `
          <div style="display:grid;gap:8px">
            ${anggota.map(a => {
              const tugasAnggota = tugasList.filter(t => t.assignee === a.id);
              const tugasSelesaiAnggota = tugasAnggota.filter(t => t.status === 'selesai').length;
              return `
                <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);display:flex;align-items:center;gap:12px">
                  <div class="avatar" style="width:40px;height:40px;font-size:.85rem">${a.avatar}</div>
                  <div style="flex:1">
                    <div class="text-sm font-600">${a.nama}</div>
                    <div class="text-xs text-muted">${a.nim}</div>
                  </div>
                  <div style="text-align:right">
                    <div class="text-xs text-muted">Tugas</div>
                    <div class="text-sm font-600">${tugasSelesaiAnggota}/${tugasAnggota.length}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
      
      <!-- Statistik Tugas -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">📊 Statistik Penyelesaian Tugas</div>
        <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);gap:12px">
          <div style="background:var(--white);padding:16px;border-radius:var(--radius-md)">
            <div class="text-xs text-muted mb-4">Total Tugas</div>
            <div class="text-2xl font-700">${totalTugas}</div>
          </div>
          <div style="background:var(--white);padding:16px;border-radius:var(--radius-md)">
            <div class="text-xs text-muted mb-4">Completion Rate</div>
            <div class="text-2xl font-700" style="color:var(--success)">${completionRate}%</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Selesai</div>
            <div class="text-lg font-700" style="color:var(--success)">${tugasSelesai}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Proses</div>
            <div class="text-lg font-700" style="color:var(--accent)">${tugasProses}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Pending</div>
            <div class="text-lg font-700" style="color:var(--warning)">${tugasPending}</div>
          </div>
          <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);text-align:center">
            <div class="text-xs text-muted">Terlambat</div>
            <div class="text-lg font-700" style="color:var(--danger)">${tugasTerlambat}</div>
          </div>
        </div>
      </div>
      
      <!-- Daftar Tugas Detail -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">📝 Daftar Tugas (${totalTugas})</div>
        ${totalTugas === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:16px">Belum ada tugas</div>' : `
          <div style="display:grid;gap:8px">
            ${tugasList.map(t => {
              const assignee = DB.users.find(u => u.id === t.assignee);
              const tugasUploads = DB.uploads.filter(u => u.tugas_id === t.id);
              const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
              const timeInfo = daysLeft < 0 ? `<span style="color:var(--danger)">Terlambat ${Math.abs(daysLeft)} hari</span>` : 
                              daysLeft === 0 ? '<span style="color:var(--warning)">Hari ini!</span>' : 
                              `<span class="text-muted">${daysLeft} hari lagi</span>`;
              return `
                <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);border-left:4px solid ${statusColor(t.status)}">
                  <div class="text-sm font-600 mb-6">${t.judul}</div>
                  <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:6px">
                    <div class="text-xs text-muted">
                      👤 ${assignee ? assignee.nama : 'Tidak ada'} · 📅 ${formatDate(t.deadline)}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                      ${timeInfo}
                      ${statusBadge(t.status)}
                    </div>
                  </div>
                  ${tugasUploads.length > 0 ? `
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:6px">
                    ${tugasUploads.map(u => `
                      <span class="badge badge-navy"
                        style="font-size:.7rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px"
                        onclick="lihatFileTugas(${u.id})" title="Klik untuk buka file">
                        📎 ${u.nama_file}
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </span>`).join('')}
                  </div>` : t.status === 'selesai' && t.file ? `
                  <div style="margin-top:6px">
                    <span class="badge badge-navy" style="font-size:.7rem;opacity:.65">📎 ${t.file}</span>
                  </div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
      
      <!-- Upload Files -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">📁 File Upload (${uploads.length})</div>
        ${uploads.length === 0 ? '<div class="text-sm text-muted" style="text-align:center;padding:16px">Belum ada file diupload</div>' : `
          <div style="display:grid;gap:8px">
            ${uploads.map(u => {
              const uploader = DB.users.find(user => user.id === u.user_id);
              return `
                <div style="background:var(--white);padding:12px;border-radius:var(--radius-md);display:flex;align-items:center;gap:12px;cursor:pointer;transition:box-shadow .15s"
                  onclick="lihatFileTugas(${u.id})" title="Klik untuk buka file"
                  onmouseover="this.style.boxShadow='0 0 0 2px var(--accent)'" onmouseout="this.style.boxShadow='none'">
                  <div style="width:40px;height:40px;background:var(--accent-lt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--accent);flex-shrink:0">${u.tipe}</div>
                  <div style="flex:1;min-width:0">
                    <div class="text-sm font-600" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.nama_file}</div>
                    <div class="text-xs text-muted">${uploader ? uploader.nama : 'Unknown'} · ${u.tanggal} · ${u.ukuran}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="flex-shrink:0">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
      
      <!-- Penilaian Saat Ini -->
      <div class="card" style="background:var(--surface)">
        <div class="card-title" style="margin-bottom:12px">⭐ Penilaian & Feedback</div>
        ${penilaian && penilaian.nilai !== null ? `
          <div style="display:grid;gap:12px">
            <div style="background:var(--white);padding:20px;border-radius:var(--radius-md);text-align:center">
              <div class="text-sm text-muted mb-8">Nilai Akhir</div>
              <div class="text-4xl font-700" style="color:var(--accent)">${penilaian.nilai}</div>
              <div style="margin-top:8px">
                ${penilaian.nilai >= 85 ? '<span class="badge badge-success" style="font-size:1rem;padding:6px 16px">Grade: A</span>' :
                  penilaian.nilai >= 70 ? '<span class="badge badge-navy" style="font-size:1rem;padding:6px 16px">Grade: B</span>' :
                  penilaian.nilai >= 55 ? '<span class="badge" style="background:#f59e0b22;color:#d97706;font-size:1rem;padding:6px 16px">Grade: C</span>' :
                  '<span class="badge badge-danger" style="font-size:1rem;padding:6px 16px">Grade: D</span>'}
              </div>
            </div>
            ${penilaian.feedback ? `
              <div style="background:var(--white);padding:16px;border-radius:var(--radius-md)">
                <div class="text-xs text-muted mb-6">💬 Feedback dari Dosen:</div>
                <div class="text-sm" style="line-height:1.6">${penilaian.feedback}</div>
              </div>
            ` : ''}
            <div class="text-xs text-muted">📅 Dinilai pada: ${formatDate(penilaian.tanggal)}</div>
          </div>
        ` : '<div class="text-sm text-muted" style="text-align:center;padding:24px">⚠️ Belum ada penilaian untuk kelompok ini</div>'}
      </div>
      
    </div>
  `;
  
  overlay.classList.remove('hidden');
}

function simpanNilai(kelompokId) {
  const nilaiInput = document.getElementById(`nilai-${kelompokId}`);
  const feedbackInput = document.getElementById(`feedback-${kelompokId}`);
  const nilaiVal = nilaiInput ? parseInt(nilaiInput.value) : null;
  const feedbackVal = feedbackInput ? feedbackInput.value.trim() : '';

  if (!nilaiInput.value) { showToast('Masukkan nilai terlebih dahulu!', 'error'); return; }
  if (isNaN(nilaiVal) || nilaiVal < 0 || nilaiVal > 100) { showToast('Nilai harus antara 0-100!', 'error'); return; }

  let p = DB.penilaian.find(x => x.kelompok_id === kelompokId);
  if (p) {
    p.nilai    = nilaiVal;
    p.feedback = feedbackVal;
    p.tanggal  = new Date().toISOString().split('T')[0];
  } else {
    DB.penilaian.push({ id: Date.now(), kelompok_id: kelompokId, dosen_id: currentUser.id, nilai: nilaiVal, feedback: feedbackVal, tanggal: new Date().toISOString().split('T')[0] });
  }

  // Update grade badge inline
  const gradeEl = document.getElementById(`grade-${kelompokId}`);
  if (gradeEl) {
    let grade = nilaiVal >= 85 ? '<span class="badge badge-success">A</span>'
              : nilaiVal >= 70 ? '<span class="badge badge-navy">B</span>'
              : nilaiVal >= 55 ? '<span class="badge" style="background:#f59e0b22;color:#d97706">C</span>'
              : '<span class="badge badge-danger">D</span>';
    gradeEl.innerHTML = grade;
  }
  showToast(`Nilai Kelompok ${kelompokId} berhasil disimpan!`, 'success');
}

/* ---- NILAI SAYA (Mahasiswa) ---- */
function renderNilaiSaya() {
  if (!currentUser || currentUser.role !== 'mahasiswa') return;
  const container = document.getElementById('nilaiSaya-list');
  if (!container) return;

  const kelompok = DB.kelompok.find(k => k.id === currentUser.kelompok_id);
  if (!kelompok) {
    container.innerHTML = `<div class="card"><p class="text-muted" style="text-align:center;padding:24px">Anda belum terdaftar di kelompok manapun.</p></div>`;
    return;
  }

  const penilaian = DB.penilaian.find(p => p.kelompok_id === kelompok.id);
  const dosen = DB.users.find(u => u.id === kelompok.dosen_id);
  const nilai = penilaian ? penilaian.nilai : null;

  const gradeInfo = nilai !== null
    ? nilai >= 85 ? { label: 'A', color: '#16a34a', bg: '#dcfce7', desc: 'Sangat Baik' }
    : nilai >= 70 ? { label: 'B', color: '#1d4ed8', bg: '#dbeafe', desc: 'Baik' }
    : nilai >= 55 ? { label: 'C', color: '#d97706', bg: '#fef3c7', desc: 'Cukup' }
    : { label: 'D', color: '#dc2626', bg: '#fee2e2', desc: 'Kurang' }
    : null;

  const tugasKelompok = DB.tugas.filter(t => t.kelompok_id === kelompok.id);
  const selesai = tugasKelompok.filter(t => t.status === 'selesai').length;
  const totalTugas = tugasKelompok.length;

  container.innerHTML = `
    <!-- Info Kelompok -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Informasi Kelompok</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <div style="flex:1;min-width:200px">
          <div style="font-size:.85rem;color:var(--text-3);margin-bottom:4px">Kelompok</div>
          <div style="font-weight:700;font-size:1.1rem">${kelompok.nama}</div>
          <div style="font-size:.82rem;color:var(--text-3);margin-top:2px">${kelompok.tema}</div>
        </div>
        <div style="flex:1;min-width:180px">
          <div style="font-size:.85rem;color:var(--text-3);margin-bottom:4px">Dosen Pembimbing</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="avatar" style="width:36px;height:36px;font-size:.75rem">${dosen ? dosen.avatar : '?'}</div>
            <div>
              <div style="font-weight:600;font-size:.9rem">${dosen ? dosen.nama : '-'}</div>
              <div style="font-size:.78rem;color:var(--text-3)">Mata Kuliah RPL Lanjut</div>
            </div>
          </div>
        </div>
        <div style="flex:1;min-width:160px">
          <div style="font-size:.85rem;color:var(--text-3);margin-bottom:4px">Progress Tugas</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:8px;background:var(--border);border-radius:99px">
              <div style="width:${kelompok.progress}%;height:100%;background:var(--primary);border-radius:99px"></div>
            </div>
            <span style="font-weight:700">${kelompok.progress}%</span>
          </div>
          <div style="font-size:.78rem;color:var(--text-3);margin-top:4px">${selesai} dari ${totalTugas} tugas selesai</div>
        </div>
      </div>
    </div>

    <!-- Nilai Utama -->
    ${nilai !== null ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title">Nilai dari Dosen Pembimbing</div>
      <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
        <!-- Nilai Box -->
        <div style="text-align:center;background:${gradeInfo.bg};border-radius:16px;padding:24px 36px;min-width:140px">
          <div style="font-size:3.5rem;font-weight:800;color:${gradeInfo.color};line-height:1">${gradeInfo.label}</div>
          <div style="font-size:.85rem;color:${gradeInfo.color};font-weight:600;margin-top:6px">${gradeInfo.desc}</div>
          <div style="font-size:2rem;font-weight:700;color:${gradeInfo.color};margin-top:8px">${nilai}<span style="font-size:1rem;font-weight:400">/100</span></div>
        </div>
        <!-- Feedback -->
        <div style="flex:1;min-width:220px">
          <div style="font-size:.85rem;color:var(--text-3);margin-bottom:8px;font-weight:600">💬 Feedback Dosen</div>
          <div style="background:var(--surface);border-radius:12px;padding:16px;font-size:.9rem;line-height:1.7;color:var(--text-1);border-left:4px solid ${gradeInfo.color}">
            ${penilaian.feedback || '<em style="color:var(--text-3)">Belum ada feedback.</em>'}
          </div>
          <div style="font-size:.75rem;color:var(--text-3);margin-top:8px">Dinilai pada: ${penilaian.tanggal || '-'}</div>
        </div>
      </div>
    </div>` : `
    <div class="card" style="margin-bottom:16px;text-align:center;padding:40px 24px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;margin:0 auto 12px;color:var(--text-3)"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
      <div style="font-size:1rem;font-weight:600;color:var(--text-2)">Nilai Belum Tersedia</div>
      <div style="font-size:.85rem;color:var(--text-3);margin-top:6px">Dosen pembimbing belum memberikan nilai untuk kelompok Anda.<br>Pantau terus halaman ini setelah semua tugas selesai.</div>
    </div>`}

    <!-- Rincian Tugas -->
    <div class="card">
      <div class="card-title">Rincian Tugas Kelompok</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Judul Tugas</th><th>Assignee</th><th>Deadline</th><th>Status</th></tr></thead>
          <tbody>${tugasKelompok.map(t => {
            const assignee = DB.users.find(u => u.id === t.assignee);
            return `<tr>
              <td><span class="font-600">${t.judul}</span></td>
              <td><div class="flex items-center gap-8"><div class="avatar" style="width:24px;height:24px;font-size:.6rem">${assignee ? assignee.avatar : '?'}</div><span class="text-sm">${assignee ? assignee.nama : '-'}</span></div></td>
              <td class="text-sm text-muted">${formatDate(t.deadline)}</td>
              <td>${statusBadge(t.status)}</td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---- MANAGE USER (Admin) ---- */
function renderManageUser() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const container = document.getElementById('manageUser-list');
  if (!container) return;
  container.innerHTML = `
    <div class="flex justify-between items-center mb-16">
      <button class="btn btn-primary" onclick="exportUserListAsPDF()" style="display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-5 6H7m5 0v3m0-3H9m5-2v-2"/></svg>
        Export PDF
      </button>
      <button class="btn btn-primary" onclick="showAddUserModal()">+ Tambah User</button>
    </div>
    <div class="card">
      <div class="card-title">Daftar Pengguna</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Nama</th><th>NIM/NIK</th><th>Email</th><th>Role</th><th>Aksi</th></tr></thead>
          <tbody id="user-table-body">${renderUserRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderUserRows() {
  return DB.users.map(u => `
    <tr>
      <td><div class="flex items-center gap-8"><div class="avatar" style="width:28px;height:28px;font-size:.7rem">${u.avatar}</div><span>${u.nama}</span></div></td>
      <td class="text-muted text-sm">${u.nim}</td>
      <td class="text-muted text-sm">${u.email}</td>
      <td>${roleBadge(u.role)}</td>
      <td><div class="flex gap-8"><button class="btn btn-sm btn-outline" onclick="showEditUserModal(${u.id})">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteUserWithConfirm(${u.id})">Hapus</button></div></td>
    </tr>`).join('');
}

function deleteUser(id) {
  if (id === currentUser.id) { showToast('Tidak bisa menghapus akun sendiri', 'error'); return; }
  const i = DB.users.findIndex(u => u.id === id);
  if (i > -1) { DB.users.splice(i, 1); }
  renderManageUser();
  showToast('User berhasil dihapus', 'success');
}

function showAddUserModal() {
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  const kelompokList = DB.kelompok.filter(k => k.status === 'aktif');
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Tambah User Baru</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="flex-col gap-12" style="display:flex;gap:12px">
      <div class="form-group"><label class="form-label">Nama Lengkap <span style="color:var(--danger)">*</span></label><input class="form-control" id="add-nama" placeholder="Nama lengkap" /></div>
      <div class="form-group"><label class="form-label">NIM/NIP <span style="color:var(--danger)">*</span></label><input class="form-control" id="add-nim" placeholder="NIM atau NIP" /></div>
      <div class="form-group"><label class="form-label">Email <span style="color:var(--danger)">*</span></label><input class="form-control" id="add-email" type="email" placeholder="email@kampus.ac.id" /></div>
      <div class="form-group"><label class="form-label">Password <span style="color:var(--danger)">*</span></label><input class="form-control" id="add-pass" type="password" placeholder="Password" /></div>
      <div class="form-group"><label class="form-label">Role <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="add-role" onchange="toggleKelompokField()">
          <option value="mahasiswa">Mahasiswa</option>
          <option value="dosen">Dosen</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="form-group" id="add-kelompok-field">
        <label class="form-label">Kelompok <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="add-kelompok">
          <option value="">-- Pilih Kelompok --</option>
          ${kelompokList.map(k => `<option value="${k.id}">${k.nama} - ${k.tema}</option>`).join('')}
        </select>
        <div class="text-xs text-muted" style="margin-top:4px">⚠️ Hanya mahasiswa yang perlu memilih kelompok</div>
      </div>
      <button class="btn btn-primary w-full" onclick="submitAddUser()" style="justify-content:center">Simpan User</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function toggleKelompokField() {
  const role = document.getElementById('add-role').value;
  const kelompokField = document.getElementById('add-kelompok-field');
  if (kelompokField) {
    kelompokField.style.display = role === 'mahasiswa' ? 'block' : 'none';
  }
}

function submitAddUser() {
  const nama  = document.getElementById('add-nama').value.trim();
  const nim   = document.getElementById('add-nim').value.trim();
  const email = document.getElementById('add-email').value.trim();
  const pass  = document.getElementById('add-pass').value;
  const role  = document.getElementById('add-role').value;
  
  if (!nama || !nim || !email || !pass) { showToast('Semua field wajib diisi', 'error'); return; }
  
  // Validate kelompok for mahasiswa
  let kelompokId = null;
  if (role === 'mahasiswa') {
    const kelompokSelect = document.getElementById('add-kelompok');
    if (kelompokSelect && !kelompokSelect.value) {
      showToast('Mahasiswa harus memilih kelompok!', 'error');
      return;
    }
    kelompokId = kelompokSelect ? parseInt(kelompokSelect.value) : null;
  }
  
  const initials = nama.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  DB.users.push({ id: Date.now(), nama, nim, email, password: pass, role, kelompok_id: kelompokId, avatar: initials });
  closeModal();
  renderManageUser();
  showToast('User berhasil ditambahkan!', 'success');
}

function showEditUserModal(userId) {
  const user = DB.users.find(u => u.id === userId);
  if (!user) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  const kelompokList = DB.kelompok.filter(k => k.status === 'aktif');
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Edit User — ${user.nama}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="flex-col gap-12" style="display:flex;gap:12px">
      <div class="form-group"><label class="form-label">Nama Lengkap</label><input class="form-control" id="edit-nama" value="${user.nama}" /></div>
      <div class="form-group"><label class="form-label">NIM/NIP</label><input class="form-control" id="edit-nim" value="${user.nim}" /></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="edit-email" type="email" value="${user.email}" /></div>
      <div class="form-group"><label class="form-label">Password Baru (kosongkan jika tidak diubah)</label><input class="form-control" id="edit-pass" type="password" placeholder="Password baru" /></div>
      <div class="form-group"><label class="form-label">Role</label>
        <select class="form-control" id="edit-role" onchange="toggleEditKelompokField(${user.kelompok_id})">
          <option value="mahasiswa" ${user.role === 'mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
          <option value="dosen" ${user.role === 'dosen' ? 'selected' : ''}>Dosen</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
      <div class="form-group" id="edit-kelompok-field" style="display:${user.role === 'mahasiswa' ? 'block' : 'none'}">
        <label class="form-label">Kelompok</label>
        <select class="form-control" id="edit-kelompok">
          <option value="">-- Pilih Kelompok --</option>
          ${kelompokList.map(k => `<option value="${k.id}" ${k.id === user.kelompok_id ? 'selected' : ''}>${k.nama} - ${k.tema}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary w-full" onclick="submitEditUser(${userId})" style="justify-content:center">Simpan Perubahan</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function toggleEditKelompokField(currentKelompokId) {
  const role = document.getElementById('edit-role').value;
  const kelompokField = document.getElementById('edit-kelompok-field');
  if (kelompokField) {
    kelompokField.style.display = role === 'mahasiswa' ? 'block' : 'none';
  }
}

function submitEditUser(userId) {
  const user = DB.users.find(u => u.id === userId);
  if (!user) return;
  
  const nama  = document.getElementById('edit-nama').value.trim();
  const nim   = document.getElementById('edit-nim').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const pass  = document.getElementById('edit-pass').value;
  const role  = document.getElementById('edit-role').value;
  
  if (!nama || !nim || !email) { showToast('Nama, NIM, dan Email wajib diisi', 'error'); return; }
  
  // Handle kelompok for mahasiswa
  let kelompokId = user.kelompok_id; // Pertahankan kelompok lama sebagai default
  if (role === 'mahasiswa') {
    const kelompokSelect = document.getElementById('edit-kelompok');
    if (kelompokSelect && kelompokSelect.value) {
      kelompokId = parseInt(kelompokSelect.value);
    } else {
      // Jika tidak ada yang dipilih, pertahankan kelompok lama
      kelompokId = user.kelompok_id;
    }
  } else {
    kelompokId = null;
  }
  
  user.nama = nama;
  user.nim = nim;
  user.email = email;
  user.role = role;
  user.kelompok_id = kelompokId;
  if (pass) user.password = pass;
  
  // Update avatar initials
  user.avatar = nama.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  
  // Update current user if editing self
  if (currentUser.id === userId) {
    currentUser = user;
    sessionStorage.setItem('smpm_user', JSON.stringify(user));
    buildSidebar();
  }
  
  closeModal();
  renderManageUser();
  showToast('User berhasil diperbarui!', 'success');
}

function deleteUserWithConfirm(userId) {
  const user = DB.users.find(u => u.id === userId);
  if (!user) return;
  
  if (userId === currentUser.id) { 
    showToast('Tidak bisa menghapus akun sendiri', 'error'); 
    return; 
  }
  
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Konfirmasi Hapus User</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="text-align:center;padding:20px 0">
      <div style="width:64px;height:64px;background:var(--danger-lt);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p style="font-size:1rem;font-weight:600;margin-bottom:8px">Hapus User Ini?</p>
      <p style="color:var(--text-2);font-size:.875rem;margin-bottom:24px">Anda akan menghapus akun <strong>${user.nama}</strong> (${user.role}). Tindakan ini tidak bisa dibatalkan.</p>
      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn btn-outline" onclick="closeModal()">Batal</button>
        <button class="btn btn-danger" onclick="deleteUser(${userId});closeModal()">Ya, Hapus</button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

/* ---- MANAGE KELOMPOK (Admin) ---- */
/* ---- state untuk filter/sort Kelola Kelompok ---- */
const KK = { search: '', filterDosen: '', filterStatus: '', filterPerhatian: false, sortKey: '', sortDir: 1 };

function renderManageKelompok() {
  if (!currentUser || currentUser.role !== 'admin') return;
  const container = document.getElementById('manageKelompok-list');
  if (!container) return;

  const dosenList = DB.users.filter(u => u.role === 'dosen');

  /* ---- stat summary ---- */
  const totalKelompok  = DB.kelompok.length;
  const perluPerhatian = DB.kelompok.filter(k => k.progress < 50).length;
  const sudahSelesai   = DB.kelompok.filter(k => k.status === 'selesai').length;
  const totalAnggota   = DB.users.filter(u => u.role === 'mahasiswa').length;

  container.innerHTML = `
    <!-- stat row -->
    <div class="stat-grid mb-20">
      <div class="stat-card"><div class="stat-label">Total Kelompok</div><div class="stat-value">${totalKelompok}</div></div>
      <div class="stat-card"><div class="stat-label">Total Mahasiswa</div><div class="stat-value">${totalAnggota}</div></div>
      <div class="stat-card"><div class="stat-label">Perlu Perhatian</div><div class="stat-value" style="color:var(--danger)">${perluPerhatian}</div></div>
      <div class="stat-card"><div class="stat-label">Selesai</div><div class="stat-value" style="color:var(--success)">${sudahSelesai}</div></div>
    </div>

    <!-- toolbar -->
    <div class="card mb-16">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <!-- search -->
        <div class="form-group" style="flex:2;min-width:180px;margin:0">
          <label class="form-label" style="font-size:.75rem">Cari nama / tema</label>
          <div style="position:relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3)">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input class="form-control" id="kk-search" placeholder="Ketik nama atau tema..."
              style="padding-left:32px" value="${KK.search}"
              oninput="KK.search=this.value;renderKelompokTable()" />
          </div>
        </div>
        <!-- filter dosen -->
        <div class="form-group" style="flex:1;min-width:160px;margin:0">
          <label class="form-label" style="font-size:.75rem">Dosen Pembimbing</label>
          <select class="form-control" id="kk-filter-dosen" onchange="KK.filterDosen=this.value;renderKelompokTable()">
            <option value="">Semua Dosen</option>
            ${dosenList.map(d => `<option value="${d.id}" ${KK.filterDosen==d.id?'selected':''}>${d.nama}</option>`).join('')}
            <option value="none" ${KK.filterDosen==='none'?'selected':''}>Belum Ada Dosen</option>
          </select>
        </div>
        <!-- filter status -->
        <div class="form-group" style="flex:1;min-width:130px;margin:0">
          <label class="form-label" style="font-size:.75rem">Status</label>
          <select class="form-control" id="kk-filter-status" onchange="KK.filterStatus=this.value;renderKelompokTable()">
            <option value="">Semua Status</option>
            <option value="aktif"    ${KK.filterStatus==='aktif'?'selected':''}>Aktif</option>
            <option value="nonaktif" ${KK.filterStatus==='nonaktif'?'selected':''}>Nonaktif</option>
            <option value="selesai"  ${KK.filterStatus==='selesai'?'selected':''}>Selesai</option>
          </select>
        </div>
        <!-- quick filter perlu perhatian -->
        <div style="display:flex;align-items:flex-end;gap:6px">
          <button id="btn-perhatian" class="btn ${KK.filterPerhatian?'btn-danger':'btn-outline'}"
            onclick="KK.filterPerhatian=!KK.filterPerhatian;renderKelompokTable()"
            style="white-space:nowrap;display:flex;align-items:center;gap:6px;font-size:.8rem">
            ⚠️ Perlu Perhatian
          </button>
        </div>
        <!-- reset -->
        <div style="display:flex;align-items:flex-end">
          <button class="btn btn-outline" onclick="KK.search='';KK.filterDosen='';KK.filterStatus='';KK.filterPerhatian=false;KK.sortKey='';renderManageKelompok()"
            style="font-size:.8rem" title="Reset semua filter">↺ Reset</button>
        </div>
      </div>
    </div>

    <!-- action bar -->
    <div class="flex justify-between items-center mb-12" style="flex-wrap:wrap;gap:8px">
      <div style="font-size:.82rem;color:var(--text-3)" id="kk-count"></div>
      <div class="flex gap-8">
        <button class="btn btn-outline" onclick="exportKelompokListAsPDF()" style="display:flex;align-items:center;gap:6px;font-size:.8rem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-5 6H7m5 0v3m0-3H9m5-2v-2"/></svg>
          Export PDF
        </button>
        <button class="btn btn-primary" onclick="showAddKelompokModal()" style="display:flex;align-items:center;gap:6px;font-size:.8rem">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Tambah Kelompok
        </button>
      </div>
    </div>

    <!-- table -->
    <div class="card">
      <div class="table-wrap">
        <table class="data-table" id="kk-table">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th>Nama Kelompok</th>
              <th>Tema Proyek</th>
              <th>Dosen Pembimbing</th>
              <th style="cursor:pointer;user-select:none" onclick="kkSort('anggota')" title="Klik untuk urutkan">
                Anggota <span id="kk-sort-anggota" style="font-size:.7rem">⇅</span>
              </th>
              <th style="cursor:pointer;user-select:none" onclick="kkSort('tugas')" title="Klik untuk urutkan">
                Tugas <span id="kk-sort-tugas" style="font-size:.7rem">⇅</span>
              </th>
              <th style="cursor:pointer;user-select:none" onclick="kkSort('progress')" title="Klik untuk urutkan">
                Progress <span id="kk-sort-progress" style="font-size:.7rem">⇅</span>
              </th>
              <th style="cursor:pointer;user-select:none" onclick="kkSort('status')" title="Klik untuk urutkan">
                Status <span id="kk-sort-status" style="font-size:.7rem">⇅</span>
              </th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="kk-tbody"></tbody>
        </table>
      </div>
    </div>
  `;
  renderKelompokTable();
}

function renderKelompokTable() {
  const tbody = document.getElementById('kk-tbody');
  const countEl = document.getElementById('kk-count');
  if (!tbody) return;

  const MAX_ANGGOTA = 5;

  let list = DB.kelompok.map(k => ({
    ...k,
    jumlahAnggota: DB.users.filter(u => u.kelompok_id === k.id && u.role === 'mahasiswa').length,
    jumlahTugas:   DB.tugas.filter(t => t.kelompok_id === k.id).length,
    dosenObj:      DB.users.find(u => u.id === k.dosen_id) || null,
  }));

  /* filter */
  if (KK.search) {
    const q = KK.search.toLowerCase();
    list = list.filter(k => k.nama.toLowerCase().includes(q) || k.tema.toLowerCase().includes(q));
  }
  if (KK.filterDosen === 'none') {
    list = list.filter(k => !k.dosen_id);
  } else if (KK.filterDosen) {
    list = list.filter(k => k.dosen_id == KK.filterDosen);
  }
  if (KK.filterStatus) list = list.filter(k => k.status === KK.filterStatus);
  if (KK.filterPerhatian) list = list.filter(k => k.progress < 50);

  /* sort */
  if (KK.sortKey) {
    list.sort((a, b) => {
      let va = a[KK.sortKey], vb = b[KK.sortKey];
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase();
      return va < vb ? -KK.sortDir : va > vb ? KK.sortDir : 0;
    });
  }

  /* update sort icons */
  ['anggota','tugas','progress','status'].forEach(k => {
    const el = document.getElementById('kk-sort-'+k);
    if (el) el.textContent = KK.sortKey===k ? (KK.sortDir===1?'↑':'↓') : '⇅';
  });

  if (countEl) countEl.textContent = `Menampilkan ${list.length} dari ${DB.kelompok.length} kelompok`;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-3)">Tidak ada kelompok yang sesuai filter.</td></tr>`;
    return;
  }

  const statusBadgeKelompok = s => {
    const map = { aktif:'badge-green', nonaktif:'badge-amber', selesai:'badge-navy' };
    return `<span class="badge ${map[s]||'badge-navy'}">${s}</span>`;
  };

  tbody.innerHTML = list.map((k, i) => `
    <tr>
      <td class="text-muted text-sm">${i+1}</td>
      <td><strong>${k.nama}</strong></td>
      <td class="text-muted text-sm" style="max-width:200px">${k.tema}</td>
      <td class="text-sm">${k.dosenObj ? k.dosenObj.nama.split(' ').slice(0,3).join(' ') : '<span class="text-muted">—</span>'}</td>
      <td style="text-align:center">
        <span style="font-weight:700;color:${k.jumlahAnggota>=MAX_ANGGOTA?'var(--danger)':'var(--text-1)'}">${k.jumlahAnggota}</span>
        <span class="text-muted text-sm">/${MAX_ANGGOTA}</span>
      </td>
      <td style="text-align:center;font-weight:700">${k.jumlahTugas}</td>
      <td style="min-width:140px">
        <div class="flex items-center gap-8">
          <div class="progress-wrap" style="flex:1"><div class="progress-fill ${progressColor(k.progress)}" style="width:${k.progress}%"></div></div>
          <span class="text-sm font-600">${k.progress}%</span>
        </div>
      </td>
      <td>${statusBadgeKelompok(k.status)}</td>
      <td>
        <div class="flex gap-5" style="flex-wrap:nowrap">
          <button class="btn btn-sm" style="background:var(--accent-lt);color:var(--accent);padding:4px 8px;font-size:.72rem"
            onclick="showDetailKelompokAdmin(${k.id})" title="Detail">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-sm btn-outline" onclick="showEditKelompokModal(${k.id})" style="padding:4px 8px;font-size:.72rem">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="hapusKelompok(${k.id})" style="padding:4px 8px;font-size:.72rem">Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function kkSort(key) {
  if (KK.sortKey === key) KK.sortDir *= -1;
  else { KK.sortKey = key; KK.sortDir = 1; }
  renderKelompokTable();
}

/* ---- DETAIL KELOMPOK (Admin) ---- */
function showDetailKelompokAdmin(kelompokId) {
  const k = DB.kelompok.find(x => x.id === kelompokId);
  if (!k) return;
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;

  const anggota   = DB.users.filter(u => u.kelompok_id === k.id && u.role === 'mahasiswa');
  const dosen     = DB.users.find(u => u.id === k.dosen_id);
  const tugasList = DB.tugas.filter(t => t.kelompok_id === k.id);
  const penilaian = DB.penilaian.find(p => p.kelompok_id === k.id);
  const MAX       = k.max_anggota || 5;

  const selesai    = tugasList.filter(t => t.status === 'selesai').length;
  const proses     = tugasList.filter(t => t.status === 'proses').length;
  const pending    = tugasList.filter(t => t.status === 'pending').length;
  const terlambat  = tugasList.filter(t => t.status === 'terlambat').length;

  const statusBadgeK = s => {
    const map = { aktif:'badge-green', nonaktif:'badge-amber', selesai:'badge-navy' };
    return `<span class="badge ${map[s]||'badge-navy'}">${s}</span>`;
  };

  body.style.maxWidth = '680px';
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">${k.nama}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="max-height:80vh;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding-top:4px">

      <!-- Info umum -->
      <div style="background:var(--surface);border-radius:var(--radius-md);padding:14px 16px">
        <div style="font-size:.78rem;color:var(--text-3);margin-bottom:3px">Tema Proyek</div>
        <div style="font-weight:600;margin-bottom:12px">${k.tema}</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <div style="flex:1;min-width:120px">
            <div style="font-size:.75rem;color:var(--text-3)">Dosen Pembimbing</div>
            <div style="font-weight:600;font-size:.88rem;margin-top:2px">${dosen ? dosen.nama : '<span style="color:var(--text-3)">Belum ditentukan</span>'}</div>
          </div>
          <div>
            <div style="font-size:.75rem;color:var(--text-3)">Status</div>
            <div style="margin-top:2px">${statusBadgeK(k.status)}</div>
          </div>
          ${k.semester ? `<div>
            <div style="font-size:.75rem;color:var(--text-3)">Semester</div>
            <div style="font-size:.85rem;font-weight:600;margin-top:2px">${k.semester}</div>
          </div>` : ''}
        </div>
        <div style="margin-top:12px">
          <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px">
            <span style="color:var(--text-3)">Progress</span>
            <span style="font-weight:700;color:var(--accent)">${k.progress}%</span>
          </div>
          <div class="progress-wrap"><div class="progress-fill ${progressColor(k.progress)}" style="width:${k.progress}%"></div></div>
        </div>
      </div>

      <!-- Statistik tugas -->
      <div>
        <div style="font-size:.82rem;font-weight:700;color:var(--text-2);margin-bottom:8px">📊 Statistik Tugas</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
          <div style="background:var(--surface);border-radius:var(--radius-md);padding:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:800">${tugasList.length}</div>
            <div style="font-size:.68rem;color:var(--text-3)">Total</div>
          </div>
          <div style="background:#f0fdf4;border-radius:var(--radius-md);padding:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:800;color:var(--success)">${selesai}</div>
            <div style="font-size:.68rem;color:var(--text-3)">Selesai</div>
          </div>
          <div style="background:#eff6ff;border-radius:var(--radius-md);padding:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:800;color:var(--accent)">${proses}</div>
            <div style="font-size:.68rem;color:var(--text-3)">Proses</div>
          </div>
          <div style="background:#fffbeb;border-radius:var(--radius-md);padding:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:800;color:var(--warning)">${pending}</div>
            <div style="font-size:.68rem;color:var(--text-3)">Pending</div>
          </div>
          <div style="background:#fef2f2;border-radius:var(--radius-md);padding:10px;text-align:center">
            <div style="font-size:1.2rem;font-weight:800;color:var(--danger)">${terlambat}</div>
            <div style="font-size:.68rem;color:var(--text-3)">Terlambat</div>
          </div>
        </div>
      </div>

      <!-- Anggota -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:.82rem;font-weight:700;color:var(--text-2)">
            👥 Anggota
            <span style="font-weight:400;color:${anggota.length>=MAX?'var(--danger)':'var(--text-3)'}">
              (${anggota.length}/${MAX})
            </span>
          </div>
          <button class="btn btn-sm btn-primary" onclick="closeModal();showEditKelompokModal(${k.id})"
            style="font-size:.72rem;padding:4px 10px">+ Kelola Anggota</button>
        </div>
        ${anggota.length === 0
          ? `<div style="padding:12px;background:var(--surface);border-radius:var(--radius-md);font-size:.82rem;color:var(--text-3);text-align:center">Belum ada anggota</div>`
          : `<div style="display:flex;flex-direction:column;gap:6px">
              ${anggota.map(a => {
                const tugasA   = tugasList.filter(t => t.assignee === a.id);
                const selesaiA = tugasA.filter(t => t.status === 'selesai').length;
                return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface);border-radius:var(--radius-md)">
                  <div class="avatar" style="width:30px;height:30px;font-size:.65rem;flex-shrink:0">${a.avatar}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:.85rem;font-weight:600">${a.nama}</div>
                    <div style="font-size:.72rem;color:var(--text-3)">${a.nim} · ${a.email}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:.72rem;color:var(--text-3)">Tugas</div>
                    <div style="font-size:.85rem;font-weight:700;color:${selesaiA===tugasA.length&&tugasA.length>0?'var(--success)':'var(--text-1)'}">${selesaiA}/${tugasA.length}</div>
                  </div>
                </div>`;
              }).join('')}
            </div>`
        }
      </div>

      <!-- Daftar tugas -->
      <div>
        <div style="font-size:.82rem;font-weight:700;color:var(--text-2);margin-bottom:8px">📋 Daftar Tugas</div>
        ${tugasList.length === 0
          ? `<div style="padding:12px;background:var(--surface);border-radius:var(--radius-md);font-size:.82rem;color:var(--text-3);text-align:center">Belum ada tugas</div>`
          : `<div style="display:flex;flex-direction:column;gap:5px">
              ${tugasList.map(t => {
                const assignee    = DB.users.find(u => u.id === t.assignee);
                const tugasUploads = DB.uploads.filter(u => u.tugas_id === t.id);
                return `<div style="padding:9px 12px;background:var(--surface);border-radius:var(--radius-md);border-left:3px solid ${statusColor(t.status)}">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
                    <div style="flex:1;min-width:0">
                      <div style="font-size:.84rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.judul}</div>
                      <div style="font-size:.72rem;color:var(--text-3);margin-top:2px">
                        ${assignee ? assignee.nama : '—'} &nbsp;·&nbsp; ${formatDate(t.deadline)}
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">
                      ${statusBadge(t.status)}
                      ${tugasUploads.map(u => `
                        <span class="badge badge-navy"
                          style="font-size:.65rem;cursor:pointer;display:inline-flex;align-items:center;gap:3px"
                          onclick="lihatFileTugas(${u.id})" title="Buka file">
                          📎
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </span>`).join('')}
                    </div>
                  </div>
                </div>`;
              }).join('')}
            </div>`
        }
      </div>

      <!-- Penilaian -->
      <div style="background:var(--surface);border-radius:var(--radius-md);padding:12px 14px">
        <div style="font-size:.82rem;font-weight:700;color:var(--text-2);margin-bottom:8px">⭐ Penilaian</div>
        ${penilaian && penilaian.nilai !== null
          ? `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
               <div style="font-size:2rem;font-weight:800;color:var(--accent)">${penilaian.nilai}<span style="font-size:.9rem;font-weight:400;color:var(--text-3)">/100</span></div>
               ${penilaian.nilai>=85?'<span class="badge badge-success">A — Sangat Baik</span>'
                :penilaian.nilai>=70?'<span class="badge badge-navy">B — Baik</span>'
                :penilaian.nilai>=55?'<span class="badge" style="background:#f59e0b22;color:#d97706">C — Cukup</span>'
                :'<span class="badge badge-danger">D — Kurang</span>'}
             </div>
             ${penilaian.feedback?`<div style="font-size:.82rem;color:var(--text-2);margin-top:6px;font-style:italic">"${penilaian.feedback}"</div>`:''}
             <div style="font-size:.72rem;color:var(--text-3);margin-top:4px">Dinilai: ${formatDate(penilaian.tanggal)}</div>`
          : `<div style="font-size:.82rem;color:var(--text-3)">Belum ada penilaian</div>`
        }
      </div>

      <!-- Tombol aksi -->
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-primary" style="flex:1;justify-content:center"
          onclick="closeModal();showEditKelompokModal(${k.id})">
          ✏️ Edit Kelompok
        </button>
        <button class="btn btn-outline" style="flex:1;justify-content:center"
          onclick="closeModal();hapusKelompok(${k.id})">
          🗑 Hapus
        </button>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

/* ---- CRUD KELOMPOK ---- */
function showAddKelompokModal() {
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  const dosenList    = DB.users.filter(u => u.role === 'dosen');
  const mahasiswaFree = DB.users.filter(u => u.role === 'mahasiswa' && !u.kelompok_id);
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Tambah Kelompok Baru</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto">
      <div class="form-group">
        <label class="form-label">Nama Kelompok <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="kk-nama" placeholder="Contoh: Kelompok 13"
          oninput="checkDuplikatNama(this.value, null)" />
        <div id="kk-nama-warn" style="font-size:.75rem;color:var(--danger);margin-top:4px;display:none"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Tema Proyek <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="kk-tema" placeholder="Contoh: Sistem Informasi Berbasis Web" />
      </div>
      <div class="form-group">
        <label class="form-label">Dosen Pembimbing</label>
        <select class="form-control" id="kk-dosen">
          <option value="">-- Pilih Dosen --</option>
          ${dosenList.map(d => `<option value="${d.id}">${d.nama}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Maks. Anggota</label>
        <input class="form-control" id="kk-maxanggota" type="number" min="1" max="20" value="5"
          style="width:90px" />
      </div>
      <div class="form-group">
        <label class="form-label">Semester / Tahun Ajaran</label>
        <input class="form-control" id="kk-semester" placeholder="Contoh: Genap 2025/2026" />
      </div>
      <button class="btn btn-primary" onclick="simpanKelompokBaru()" style="justify-content:center;padding:12px">
        Simpan Kelompok
      </button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function checkDuplikatNama(nama, excludeId) {
  const warn = document.getElementById('kk-nama-warn');
  if (!warn) return;
  const dup = DB.kelompok.find(k => k.nama.toLowerCase() === nama.trim().toLowerCase() && k.id !== excludeId);
  if (dup) {
    warn.textContent = `⚠ Nama "${nama.trim()}" sudah digunakan oleh kelompok lain.`;
    warn.style.display = 'block';
  } else {
    warn.style.display = 'none';
  }
}

function simpanKelompokBaru() {
  const nama      = document.getElementById('kk-nama').value.trim();
  const tema      = document.getElementById('kk-tema').value.trim();
  const dosenId   = document.getElementById('kk-dosen').value;
  const maxAngg   = parseInt(document.getElementById('kk-maxanggota').value) || 5;
  const semester  = document.getElementById('kk-semester')?.value.trim() || '';

  if (!nama) { showToast('Nama kelompok wajib diisi!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib diisi!', 'error'); return; }

  /* validasi duplikat */
  if (DB.kelompok.find(k => k.nama.toLowerCase() === nama.toLowerCase())) {
    showToast(`Nama "${nama}" sudah digunakan!`, 'error'); return;
  }

  const newK = {
    id:          Math.max(...DB.kelompok.map(k => k.id), 0) + 1,
    nama, tema,
    dosen_id:    dosenId ? parseInt(dosenId) : null,
    progress:    0,
    status:      'aktif',
    max_anggota: maxAngg,
    semester:    semester || null,
  };
  DB.kelompok.push(newK);
  closeModal();
  renderManageKelompok();
  showToast(`Kelompok "${nama}" berhasil ditambahkan!`, 'success');
}

function showEditKelompokModal(kelompokId) {
  const k = DB.kelompok.find(x => x.id === kelompokId);
  if (!k) return;
  const overlay  = document.getElementById('modal-overlay');
  const body     = document.getElementById('modal-body');
  if (!overlay || !body) return;
  const dosenList = DB.users.filter(u => u.role === 'dosen');
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Edit ${k.nama}</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto">
      <div class="form-group">
        <label class="form-label">Nama Kelompok <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="ek-nama" value="${k.nama}"
          oninput="checkDuplikatNama(this.value, ${k.id})" />
        <div id="kk-nama-warn" style="font-size:.75rem;color:var(--danger);margin-top:4px;display:none"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Tema Proyek <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="ek-tema" value="${k.tema}" />
      </div>
      <div class="form-group">
        <label class="form-label">Dosen Pembimbing</label>
        <select class="form-control" id="ek-dosen">
          <option value="">-- Tanpa Dosen --</option>
          ${dosenList.map(d => `<option value="${d.id}" ${d.id===k.dosen_id?'selected':''}>${d.nama}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:12px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Progress (%)</label>
          <input class="form-control" id="ek-progress" type="number" min="0" max="100" value="${k.progress}" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Maks. Anggota</label>
          <input class="form-control" id="ek-maxanggota" type="number" min="1" max="20" value="${k.max_anggota||5}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="ek-status">
          <option value="aktif"    ${k.status==='aktif'?'selected':''}>Aktif</option>
          <option value="nonaktif" ${k.status==='nonaktif'?'selected':''}>Nonaktif</option>
          <option value="selesai"  ${k.status==='selesai'?'selected':''}>Selesai</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Semester / Tahun Ajaran</label>
        <input class="form-control" id="ek-semester" value="${k.semester||''}" placeholder="Contoh: Genap 2025/2026" />
      </div>
      <button class="btn btn-primary" onclick="updateKelompok(${k.id})" style="justify-content:center;padding:12px">
        Simpan Perubahan
      </button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function updateKelompok(kelompokId) {
  const k = DB.kelompok.find(x => x.id === kelompokId);
  if (!k) return;
  const nama     = document.getElementById('ek-nama').value.trim();
  const tema     = document.getElementById('ek-tema').value.trim();
  const dosenId  = document.getElementById('ek-dosen').value;
  const progress = parseInt(document.getElementById('ek-progress').value) || 0;
  const status   = document.getElementById('ek-status').value;
  const maxAngg  = parseInt(document.getElementById('ek-maxanggota').value) || 5;
  const semester = document.getElementById('ek-semester')?.value.trim() || null;

  if (!nama) { showToast('Nama kelompok wajib diisi!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib diisi!', 'error'); return; }

  /* validasi duplikat (kecuali diri sendiri) */
  if (DB.kelompok.find(x => x.id !== kelompokId && x.nama.toLowerCase() === nama.toLowerCase())) {
    showToast(`Nama "${nama}" sudah digunakan!`, 'error'); return;
  }

  /* validasi: anggota saat ini tidak boleh melebihi batas baru */
  const currentAnggota = DB.users.filter(u => u.kelompok_id === kelompokId && u.role === 'mahasiswa').length;
  if (maxAngg < currentAnggota) {
    showToast(`Batas anggota (${maxAngg}) lebih kecil dari anggota saat ini (${currentAnggota})!`, 'error'); return;
  }

  k.nama        = nama;
  k.tema        = tema;
  k.dosen_id    = dosenId ? parseInt(dosenId) : null;
  k.progress    = progress;
  k.status      = status;
  k.max_anggota = maxAngg;
  k.semester    = semester;

  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil diperbarui!', 'success');
}

function hapusKelompok(kelompokId) {
  const k = DB.kelompok.find(x => x.id === kelompokId);
  if (!k) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  const jumlahAnggota = DB.users.filter(u => u.kelompok_id === kelompokId).length;
  const jumlahTugas = DB.tugas.filter(t => t.kelompok_id === kelompokId).length;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Konfirmasi Hapus Kelompok</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="text-align:center;padding:20px 0">
      <div style="width:64px;height:64px;background:var(--danger-lt);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p style="font-size:1rem;font-weight:600;margin-bottom:8px">Hapus ${k.nama}?</p>
      <p style="font-size:.875rem;color:var(--text-3);margin-bottom:16px">Tindakan ini tidak dapat dibatalkan.</p>
      ${jumlahAnggota > 0 || jumlahTugas > 0 ? `
        <div style="background:var(--warning-lt);color:#92400E;padding:12px;border-radius:var(--radius-md);font-size:.82rem;margin-bottom:16px">
          ⚠️ Kelompok ini memiliki:<br>
          • ${jumlahAnggota} anggota<br>
          • ${jumlahTugas} tugas<br>
          Semua data terkait akan dihapus!
        </div>
      ` : ''}
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline w-full" onclick="closeModal()" style="justify-content:center">Batal</button>
      <button class="btn btn-danger w-full" onclick="konfirmasiHapusKelompok(${k.id})" style="justify-content:center">Ya, Hapus</button>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function konfirmasiHapusKelompok(kelompokId) {
  const k = DB.kelompok.find(x => x.id === kelompokId);
  if (!k) return;
  
  // Remove related tasks
  DB.tugas = DB.tugas.filter(t => t.kelompok_id !== kelompokId);
  
  // Remove related uploads
  DB.uploads = DB.uploads.filter(u => u.kelompok_id !== kelompokId);
  
  // Remove related assessments
  DB.penilaian = DB.penilaian.filter(p => p.kelompok_id !== kelompokId);
  
  // Remove group
  const index = DB.kelompok.findIndex(x => x.id === kelompokId);
  if (index > -1) {
    DB.kelompok.splice(index, 1);
  }
  
  // Update users' kelompok_id to null
  DB.users.forEach(u => {
    if (u.kelompok_id === kelompokId) {
      u.kelompok_id = null;
    }
  });
  
  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil dihapus!', 'success');
}

/* ---- MODAL ---- */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/* ---- TOAST ---- */
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', '': 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ---- HELPERS ---- */
function formatDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function statusBadge(status) {
  const map   = { selesai: 'badge-green', proses: 'badge-blue', terlambat: 'badge-red', pending: 'badge-amber' };
  const label = { selesai: 'Selesai', proses: 'Proses', terlambat: 'Terlambat', pending: 'Pending' };
  return `<span class="badge ${map[status] || 'badge-navy'}">${label[status] || status}</span>`;
}
function statusColor(status) {
  const map = { selesai: 'var(--success)', proses: 'var(--accent)', terlambat: 'var(--danger)', pending: 'var(--warning)' };
  return map[status] || 'var(--border)';
}
function progressColor(p) { return p >= 70 ? 'progress-green' : p >= 40 ? 'progress-blue' : p >= 20 ? 'progress-amber' : 'progress-red'; }
function progressBadge(p) {
  if (p >= 70) return '<span class="badge badge-green">On Track</span>';
  if (p >= 40) return '<span class="badge badge-blue">Sedang</span>';
  return '<span class="badge badge-red">Perlu Perhatian</span>';
}
function roleBadge(role) {
  const map = { mahasiswa: 'badge-blue', dosen: 'badge-amber', admin: 'badge-red' };
  return `<span class="badge ${map[role] || 'badge-navy'}">${role.charAt(0).toUpperCase()+role.slice(1)}</span>`;
}

/* ---- NOTIFICATIONS ---- */
function showNotifications() {
  if (!currentUser) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  let notifications = [];
  
  if (currentUser.role === 'mahasiswa') {
    const myTugas = DB.tugas.filter(t => t.kelompok_id === currentUser.kelompok_id);
    const today = new Date();
    
    myTugas.forEach(t => {
      const dl = new Date(t.deadline);
      const diff = Math.ceil((dl - today) / 86400000);
      
      if (diff < 0 && t.status !== 'selesai') {
        notifications.push({ type: 'danger', msg: `Tugas "${t.judul}" sudah terlambat!`, time: formatDate(t.deadline) });
      } else if (diff <= 3 && diff >= 0 && t.status !== 'selesai') {
        notifications.push({ type: 'warning', msg: `Deadline tugas "${t.judul}" dalam ${diff} hari`, time: formatDate(t.deadline) });
      }
    });
  }
  
  if (currentUser.role === 'dosen') {
    const kelompokList = DB.kelompok.filter(k => k.dosen_id === currentUser.id);
    kelompokList.forEach(k => {
      if (k.progress < 50) {
        notifications.push({ type: 'warning', msg: `${k.nama} progress rendah (${k.progress}%)`, time: 'Monitoring' });
      }
    });
  }
  
  if (notifications.length === 0) {
    notifications.push({ type: 'info', msg: 'Tidak ada notifikasi baru', time: '' });
  }
  
  const notifIcon = { danger: '🔴', warning: '🟡', info: 'ℹ️', success: '🟢' };
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Notifikasi</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="max-height:400px;overflow-y:auto">
      ${notifications.map(n => `
        <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:1.2rem">${notifIcon[n.type] || 'ℹ️'}</span>
          <div style="flex:1">
            <div style="font-size:.875rem;font-weight:500">${n.msg}</div>
            ${n.time ? `<div style="font-size:.75rem;color:var(--text-3);margin-top:4px">${n.time}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  overlay.classList.remove('hidden');
}

/* ---- SETTINGS ---- */
function showSettings() {
  if (!currentUser) return;
  
  const overlay = document.getElementById('modal-overlay');
  const body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Pengaturan Akun</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="flex-col gap-12" style="display:flex;gap:12px">
      <div style="text-align:center;padding:16px;background:var(--surface);border-radius:var(--radius-lg);margin-bottom:8px">
        <div class="avatar avatar-lg" style="margin:0 auto 12px">${currentUser.avatar}</div>
        <div style="font-weight:700;font-size:1.1rem">${currentUser.nama}</div>
        <div style="font-size:.82rem;color:var(--text-3)">${currentUser.email} · ${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}</div>
      </div>
      
      ${currentUser.role === 'mahasiswa' ? `
        <div class="form-group"><label class="form-label">Password Lama</label><input class="form-control" id="set-old-pass" type="password" placeholder="Masukkan password lama" /></div>
        <div class="form-group"><label class="form-label">Password Baru</label><input class="form-control" id="set-new-pass" type="password" placeholder="Masukkan password baru" /></div>
        <button class="btn btn-primary w-full" onclick="changePassword()">Ubah Password</button>
      ` : `
        <div class="form-group"><label class="form-label">Password Baru</label><input class="form-control" id="set-new-pass" type="password" placeholder="Masukkan password baru" /></div>
        <button class="btn btn-primary w-full" onclick="changePassword()">Ubah Password</button>
      `}
      
      <div style="padding-top:16px;border-top:1px solid var(--border);margin-top:8px">
        <p style="font-size:.75rem;color:var(--text-3);margin-bottom:8px">Info Aplikasi</p>
        <p style="font-size:.82rem">SMPM v1.0 — Sistem Manajemen Proyek Mahasiswa</p>
        <p style="font-size:.75rem;color:var(--text-3);margin-top:4px">Kelompok 09 · Studi Kasus Pemrograman Web</p>
      </div>
    </div>
  `;
  overlay.classList.remove('hidden');
}

function changePassword() {
  if (!currentUser) return;
  
  const oldPass = document.getElementById('set-old-pass')?.value;
  const newPass = document.getElementById('set-new-pass')?.value;
  
  if (!newPass) {
    showToast('Password baru tidak boleh kosong', 'error');
    return;
  }
  
  if (newPass.length < 6) {
    showToast('Password minimal 6 karakter', 'error');
    return;
  }
  
  // For mahasiswa, verify old password
  if (currentUser.role === 'mahasiswa') {
    if (!oldPass) {
      showToast('Masukkan password lama', 'error');
      return;
    }
    if (oldPass !== currentUser.password) {
      showToast('Password lama salah', 'error');
      return;
    }
  }
  
  // Update password
  const user = DB.users.find(u => u.id === currentUser.id);
  if (user) {
    user.password = newPass;
    currentUser.password = newPass;
    sessionStorage.setItem('smpm_user', JSON.stringify(currentUser));
    closeModal();
    showToast('Password berhasil diubah!', 'success');
  }
}

/* ---- PDF EXPORT FUNCTIONS ---- */
function downloadPDF(filename, content) {
  const win = window.open('', '', 'height=700,width=900');
  win.document.write('<!DOCTYPE html>');
  win.document.write('<html><head><title>' + filename + '</title>');
  win.document.write('<meta charset="UTF-8">');
  win.document.write('<style>');
  win.document.write('body { font-family: Arial, sans-serif; padding: 40px; color: #0B1F3A; }');
  win.document.write('h1 { font-size: 24px; margin-bottom: 8px; color: #0B1F3A; }');
  win.document.write('h2 { font-size: 18px; margin-bottom: 16px; color: #2F80ED; }');
  win.document.write('p { font-size: 14px; margin: 8px 0; color: #475569; }');
  win.document.write('table { width: 100%; border-collapse: collapse; margin-top: 24px; }');
  win.document.write('th, td { border: 1px solid #E2E8F0; padding: 10px 12px; text-align: left; font-size: 13px; }');
  win.document.write('th { background-color: #0B1F3A; color: white; font-weight: 600; }');
  win.document.write('tr:nth-child(even) { background-color: #F8FAFC; }');
  win.document.write('.footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center; }');
  win.document.write('@media print { body { padding: 20px; } .no-print { display: none; } }');
  win.document.write('</style></head><body>');
  win.document.write(content);
  win.document.write('<div class="footer">');
  win.document.write('<p>SMPM — Sistem Manajemen Proyek Mahasiswa · Kelompok 09</p>');
  win.document.write('<p>Dicetak pada: ' + new Date().toLocaleString('id-ID') + '</p>');
  win.document.write('</div>');
  win.document.write('</body></html>');
  win.document.close();
  
  // Auto trigger print after content loads
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
}

function exportTugasAsPDF() {
  if (!currentUser) return;
  
  let html = '<h2>Laporan Tugas - ' + currentUser.nama + '</h2>';
  html += '<p>Tanggal: ' + new Date().toLocaleDateString('id-ID') + '</p>';
  html += '<table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">';
  html += '<thead><tr style="background:#0B1F3A; color:white;"><th>No</th><th>Tugas</th><th>Deadline</th><th>Status</th></tr></thead><tbody>';
  
  const myTugas = DB.tugas.filter(t => t.kelompok_id === currentUser.kelompok_id);
  myTugas.forEach((t, idx) => {
    const statusColor = t.status === 'selesai' ? '#16A34A' : t.status === 'proses' ? '#2F80ED' : '#DC2626';
    html += '<tr><td>' + (idx + 1) + '</td><td>' + t.judul + '</td><td>' + formatDate(t.deadline) + '</td>';
    html += '<td style="background:' + statusColor + '; color:white;">' + (t.status.charAt(0).toUpperCase() + t.status.slice(1)) + '</td></tr>';
  });
  
  html += '</tbody></table>';
  downloadPDF('Laporan_Tugas_' + new Date().getTime() + '.pdf', html);
}

function exportMonitoringAsPDF() {
  let html = '<h2>Laporan Monitoring Kelompok</h2>';
  html += '<p>Tanggal: ' + new Date().toLocaleDateString('id-ID') + '</p>';
  html += '<p>Dosen: ' + currentUser.nama + '</p>';
  html += '<table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">';
  html += '<thead><tr style="background:#0B1F3A; color:white;"><th>No</th><th>Kelompok</th><th>Tema</th><th>Progress</th><th>Status</th></tr></thead><tbody>';
  
  DB.kelompok.forEach((k, idx) => {
    if (k.dosen_id === currentUser.id) {
      html += '<tr><td>' + (idx + 1) + '</td><td>' + k.nama + '</td><td>' + k.tema + '</td>';
      html += '<td>' + k.progress + '%</td>';
      html += '<td style="background:#16A34A; color:white;">' + (k.status.charAt(0).toUpperCase() + k.status.slice(1)) + '</td></tr>';
    }
  });
  
  html += '</tbody></table>';
  downloadPDF('Laporan_Monitoring_' + new Date().getTime() + '.pdf', html);
}

function exportUserListAsPDF() {
  let html = '<h2>Laporan Data Pengguna</h2>';
  html += '<p>Tanggal: ' + new Date().toLocaleDateString('id-ID') + '</p>';
  html += '<table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">';
  html += '<thead><tr style="background:#0B1F3A; color:white;"><th>No</th><th>Nama</th><th>NIM</th><th>Email</th><th>Role</th></tr></thead><tbody>';
  
  DB.users.forEach((u, idx) => {
    const roleColor = u.role === 'mahasiswa' ? '#2F80ED' : u.role === 'dosen' ? '#D97706' : '#DC2626';
    html += '<tr><td>' + (idx + 1) + '</td><td>' + u.nama + '</td><td>' + u.nim + '</td><td>' + u.email + '</td>';
    html += '<td style="background:' + roleColor + '; color:white;">' + (u.role.charAt(0).toUpperCase() + u.role.slice(1)) + '</td></tr>';
  });
  
  html += '</tbody></table>';
  downloadPDF('Laporan_Data_Pengguna_' + new Date().getTime() + '.pdf', html);
}

function exportKelompokListAsPDF() {
  let html = '<h2>Laporan Data Kelompok</h2>';
  html += '<p>Tanggal: ' + new Date().toLocaleDateString('id-ID') + '</p>';
  html += '<table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">';
  html += '<thead><tr style="background:#0B1F3A; color:white;"><th>No</th><th>Kelompok</th><th>Tema</th><th>Progress</th><th>Status</th></tr></thead><tbody>';
  
  DB.kelompok.forEach((k, idx) => {
    html += '<tr><td>' + (idx + 1) + '</td><td>' + k.nama + '</td><td>' + k.tema + '</td>';
    html += '<td>' + k.progress + '%</td>';
    html += '<td style="background:#16A34A; color:white;">' + (k.status.charAt(0).toUpperCase() + k.status.slice(1)) + '</td></tr>';
  });
  
  html += '</tbody></table>';
  downloadPDF('Laporan_Data_Kelompok_' + new Date().getTime() + '.pdf', html);
}

/* ---- ROLE-BASED ACCESS CONTROL ---- */
function canAccessPage(pageName, role) {
  const permissions = {
    mahasiswa: ['dashboard', 'tugas', 'deadline', 'upload', 'kelompok', 'nilaiSaya'],
    dosen: ['dashboard', 'tugasDosen', 'monitoring', 'penilaian'],
    admin: ['dashboard', 'manageUser', 'manageKelompok'],
  };
  return permissions[role]?.includes(pageName) || false;
}

function hasAccessPage(pageName) {
  if (!currentUser) return false;
  return canAccessPage(pageName, currentUser.role);
}

/* ---- SIDEBAR MENUS BY ROLE ---- */
function buildSidebar() {
  if (!currentUser) return;
  const menus = {
    mahasiswa: [
      { page: 'dashboard', label: 'Dashboard',       icon: 'grid' },
      { page: 'tugas',     label: 'Tugas Saya',      icon: 'tasks' },
      { page: 'deadline',  label: 'Deadline',         icon: 'clock' },
      { page: 'upload',    label: 'Upload Progress',  icon: 'upload' },
      { page: 'kelompok',  label: 'Kelompok Saya',   icon: 'users' },
      { page: 'nilaiSaya', label: 'Nilai Saya',       icon: 'star' },
    ],
    dosen: [
      { page: 'dashboard',   label: 'Dashboard',       icon: 'grid' },
      { page: 'tugasDosen',  label: 'Tugas Kelompok',  icon: 'tasks' },
      { page: 'monitoring',  label: 'Monitoring',      icon: 'eye' },
      { page: 'penilaian',   label: 'Penilaian',       icon: 'star' },
    ],
    admin: [
      { page: 'dashboard',       label: 'Overview',        icon: 'grid' },
      { page: 'manageUser',      label: 'Kelola User',     icon: 'users' },
      { page: 'manageKelompok',  label: 'Kelola Kelompok', icon: 'folder' },
    ],
  };
  const navEl = document.getElementById('sidebar-nav');
  const footerEl = document.getElementById('sidebar-user-name');
  const footerRole = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-avatar');
  if (footerEl) footerEl.textContent = currentUser.nama;
  if (footerRole) footerRole.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  if (avatarEl) avatarEl.textContent = currentUser.avatar;
  const roleMenus = menus[currentUser.role] || menus.mahasiswa;
  if (navEl) {
    navEl.innerHTML = roleMenus.map(m => `
      <div class="nav-item" data-page="${m.page}" onclick="showPage('${m.page}')">
        ${svgIcon(m.icon)}<span>${m.label}</span>
      </div>`).join('');
  }
}

function svgIcon(name) {
  const icons = {
    grid:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    tasks:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/><path d="M9 12l2 2 4-4"/></svg>`,
    clock:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
    users:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
    eye:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    star:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`,
  };
  return icons[name] || icons.grid;
}

/* ---- PAGE NAVIGATION (Global functions) ---- */
function showLoginPage() {
  document.getElementById('page-register').classList.add('hidden');
  document.getElementById('page-login').classList.remove('hidden');
  // reset layout
  const mc = document.getElementById('main-content');
  if (mc) mc.style.marginLeft = '0';
}

function showRegisterPage() {
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-register').classList.remove('hidden');
  // ensure no sidebar margin
  const mc = document.getElementById('main-content');
  if (mc) mc.style.marginLeft = '0';
  
  // Populate kelompok dropdown
  const kelompokSelect = document.getElementById('reg-kelompok');
  if (kelompokSelect) {
    const kelompokList = DB.kelompok.filter(k => k.status === 'aktif');
    kelompokSelect.innerHTML = `
      <option value="">— Pilih kelompok Anda —</option>
      ${kelompokList.map(k => `<option value="${k.id}">${k.nama} — ${k.tema}</option>`).join('')}
    `;
  }

  // Attach password strength meter
  const passInput = document.getElementById('reg-pass');
  if (passInput && !passInput._strengthBound) {
    passInput._strengthBound = true;
    passInput.addEventListener('input', function () {
      updatePasswordStrength(this.value);
    });
  }
}

/* Toggle show/hide password on register form */
function toggleRegPass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.style.color = isText ? '' : 'var(--accent)';
}

/* Password strength indicator */
function updatePasswordStrength(val) {
  const wrap  = document.getElementById('reg-strength-wrap');
  const fill  = document.getElementById('reg-strength-fill');
  const label = document.getElementById('reg-strength-label');
  if (!wrap || !fill || !label) return;

  if (!val) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';

  let score = 0;
  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct: '20%', color: '#EF4444', text: 'Lemah' },
    { pct: '40%', color: '#F97316', text: 'Cukup' },
    { pct: '60%', color: '#EAB308', text: 'Sedang' },
    { pct: '80%', color: '#22C55E', text: 'Kuat' },
    { pct: '100%', color: '#16A34A', text: 'Sangat Kuat' },
  ];
  const lvl = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = lvl.pct;
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
}

function handleRegister() {
  const nama = document.getElementById('reg-nama').value.trim();
  const nim = document.getElementById('reg-nim').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const kelompokId = document.getElementById('reg-kelompok').value;
  const password = document.getElementById('reg-pass').value;
  const confirmPass = document.getElementById('reg-confirm').value;
  
  const errorDiv = document.getElementById('register-error');
  const errorMsg = document.getElementById('register-error-msg');
  
  // Validation
  if (!nama || !nim || !email || !kelompokId || !password || !confirmPass) {
    errorMsg.textContent = 'Semua field wajib diisi!';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  if (!email.includes('@kampus.ac.id')) {
    errorMsg.textContent = 'Email harus menggunakan @kampus.ac.id!';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  if (password.length < 6) {
    errorMsg.textContent = 'Password minimal 6 karakter!';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  if (password !== confirmPass) {
    errorMsg.textContent = 'Konfirmasi password tidak cocok!';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  // Check if email already exists
  const existingUser = DB.users.find(u => u.email === email);
  if (existingUser) {
    errorMsg.textContent = 'Email sudah terdaftar! Gunakan email lain atau login.';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  // Check if NIM already exists
  const existingNIM = DB.users.find(u => u.nim === nim);
  if (existingNIM) {
    errorMsg.textContent = 'NIM sudah terdaftar!';
    errorDiv.classList.remove('hidden');
    return;
  }
  
  // Create new user
  const initials = nama.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const newUser = {
    id: Date.now(),
    nama: nama,
    nim: nim,
    email: email,
    password: password,
    role: 'mahasiswa',
    kelompok_id: parseInt(kelompokId),
    avatar: initials
  };
  
  DB.users.push(newUser);
  
  // Show success and redirect to login
  errorDiv.classList.add('hidden');
  showToast('✅ Registrasi berhasil! Silakan login dengan akun baru Anda.', 'success');
  
  setTimeout(() => {
    showLoginPage();
    // Pre-fill login form
    const loginEmail = document.getElementById('login-email');
    const loginPass = document.getElementById('login-pass');
    if (loginEmail) loginEmail.value = email;
    if (loginPass) loginPass.value = '';
    if (loginPass) loginPass.focus();
  }, 1500);
}

/* ---- FORGOT PASSWORD (Global function for inline onclick) ---- */
function handleForgotPassword() {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  if (!overlay || !body) return;
  
  body.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">🔐 Reset Password</div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;padding-top:16px">
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:.85rem;color:var(--text-2);margin-bottom:8px">
          Masukkan email dan password baru Anda
        </div>
        <div style="font-size:.7rem;color:var(--warning)">
          ⚠️ Demo: Password langsung direset tanpa email verification
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Email Akun <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="reset-email" type="email" placeholder="email@kampus.ac.id" />
      </div>
      
      <div class="form-group">
        <label class="form-label">Password Baru <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="reset-password" type="password" placeholder="Minimal 6 karakter" />
        <div class="text-xs text-muted" style="margin-top:4px">💡 Minimal 6 karakter untuk mahasiswa</div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Konfirmasi Password <span style="color:var(--danger)">*</span></label>
        <input class="form-control" id="reset-confirm" type="password" placeholder="Ulangi password baru" />
      </div>
      
      <button class="btn btn-primary w-full" onclick="submitResetPassword()" style="justify-content:center">
        Reset Password Sekarang
      </button>
      
      <div style="text-align:center;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:.75rem;color:var(--text-3)">
          🛡️ Atau hubungi admin: admin@kampus.ac.id
        </div>
      </div>
    </div>
  `;
  
  overlay.classList.remove('hidden');
}

function submitResetPassword() {
  const email = document.getElementById('reset-email').value.trim();
  const newPass = document.getElementById('reset-password').value;
  const confirmPass = document.getElementById('reset-confirm').value;
  
  // Validation
  if (!email || !newPass || !confirmPass) {
    showToast('Semua field wajib diisi!', 'error');
    return;
  }
  
  if (!email.includes('@')) {
    showToast('Format email tidak valid!', 'error');
    return;
  }
  
  if (newPass.length < 6) {
    showToast('Password minimal 6 karakter!', 'error');
    return;
  }
  
  if (newPass !== confirmPass) {
    showToast('Konfirmasi password tidak cocok!', 'error');
    return;
  }
  
  // Check if email exists in database
  const user = DB.users.find(u => u.email === email);
  
  if (!user) {
    showToast('Email tidak ditemukan dalam sistem!', 'error');
    return;
  }
  
  // Reset password directly (demo mode)
  user.password = newPass;
  
  closeModal();
  showToast(`✅ Password berhasil direset! Silakan login dengan password baru.`, 'success');
  
  // Pre-fill the login form with the email
  setTimeout(() => {
    const loginEmail = document.getElementById('login-email');
    const loginPass = document.getElementById('login-pass');
    if (loginEmail) loginEmail.value = email;
    if (loginPass) loginPass.value = '';
    if (loginPass) loginPass.focus();
  }, 100);
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');
      const infoEl = document.getElementById('login-info');
      
      if (login(email, pass)) {
        errEl.classList.add('hidden');
        infoEl.classList.add('hidden');
        buildSidebar();
        showPage('dashboard');
      } else {
        errEl.classList.remove('hidden');
        infoEl.classList.add('hidden');
      }
    });
  }
  
  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      handleRegister();
    });
  }

  document.getElementById('logout-btn')?.addEventListener('click', logout);
  
  // Notification button
  document.querySelector('.icon-btn.notif-dot')?.addEventListener('click', showNotifications);
  
  // Settings button
  document.querySelectorAll('.icon-btn')[1]?.addEventListener('click', showSettings);
  
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  if (checkSession()) {
    buildSidebar();
    showPage('dashboard');
  } else {
    showPage('login');
  }
});
