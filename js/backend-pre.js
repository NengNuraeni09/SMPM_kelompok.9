/* =============================================
   SMPM — Backend PRE (load SEBELUM app.js)
   Override checkSession, login, logout LEBIH AWAL
   sehingga DOMContentLoaded di app.js pakai versi ini
   ============================================= */
'use strict';

/* ---- API Helper (duplikat kecil, backend-post.js punya versi lengkap) ---- */
async function _apiPost(action, data = {}) {
  const body = new FormData();
  body.append('action', action);
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) body.append(k, v);
  }
  const res = await fetch('api.php?action=' + encodeURIComponent(action), { method: 'POST', body });
  return res.json();
}

async function _apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  const res = await fetch('api.php?' + qs);
  return res.json();
}

/* ---- DB object — app.js akan pakai ini ---- */
// Dideklarasikan di sini agar app.js tidak buat ulang dengan data mock
const DB = {
  users:     [],
  kelompok:  [],
  tugas:     [],
  uploads:   [],
  penilaian: [],
};

function _formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '0 KB';
  if (+bytes >= 1048576) return (+bytes / 1048576).toFixed(1) + ' MB';
  return Math.round(+bytes / 1024) + ' KB';
}

async function loadDB() {
  const res = await _apiGet('get_data');
  if (!res.ok) return;
  const d = res.data;

  DB.users = (d.users || []).map(u => ({
    ...u,
    id:          +u.id,
    kelompok_id: u.kelompok_id ? +u.kelompok_id : null,
  }));
  DB.kelompok = (d.kelompok || []).map(k => ({
    ...k,
    id:       +k.id,
    dosen_id: k.dosen_id ? +k.dosen_id : null,
    progress: +k.progress,
    max_anggota: +(k.max_anggota || 5),
  }));
  DB.tugas = (d.tugas || []).map(t => ({
    ...t,
    id:          +t.id,
    kelompok_id: +t.kelompok_id,
    assignee:    t.assignee_id ? +t.assignee_id : null,
    assignee_id: t.assignee_id ? +t.assignee_id : null,
    file:        null,
  }));
  DB.uploads = (d.uploads || []).map(u => ({
    ...u,
    id:          +u.id,
    kelompok_id: +u.kelompok_id,
    user_id:     +u.user_id,
    tugas_id:    u.tugas_id ? +u.tugas_id : null,
    tanggal:     u.uploaded_at || '',
    ukuran:      _formatBytes(+u.ukuran),
    tipe:        (u.tipe || '').toUpperCase(),
    dataUrl:     null,
  }));
  DB.penilaian = (d.penilaian || []).map(p => ({
    ...p,
    id:          +p.id,
    kelompok_id: +p.kelompok_id,
    dosen_id:    +p.dosen_id,
    nilai:       p.nilai !== null && p.nilai !== undefined ? +p.nilai : null,
    tanggal:     p.dinilai_at || null,
  }));
}

/* ---- Override checkSession — app.js panggil ini di DOMContentLoaded ---- */
function checkSession() {
  // Sinkronus: baca dari __SMPM_SESSION__ yang di-inject PHP
  const sess = window.__SMPM_SESSION__;
  if (sess) {
    window.__currentUser = sess; // simpan sementara
    return true;
  }
  return false;
}

/* ---- Override login — app.js panggil ini saat form submit ---- */
// Versi sinkronus (return false), lalu async handler override di backend-post.js
function login(email, password) {
  // Kembalikan false dulu — backend-post.js akan override form submit secara async
  return false;
}

/* ---- Override logout ---- */
function logout() {
  _apiPost('logout').finally(() => {
    window.__SMPM_SESSION__ = null;
    if (typeof currentUser !== 'undefined') { try { currentUser = null; } catch(e){} }
    // showPage('login') dipanggil setelah ini oleh app.js
  });
}
