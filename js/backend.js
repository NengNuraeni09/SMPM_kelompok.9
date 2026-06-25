/* =============================================
   SMPM — Backend Bridge
   Menggantikan mock DB dengan API calls ke api.php
   File ini di-load SEBELUM app.js via index.php
   ============================================= */

'use strict';

/* ============================================================
   API HELPER
   ============================================================ */
async function apiPost(action, data = {}) {
  const body = new FormData();
  body.append('action', action);
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) body.append(k, v);
  }
  const res  = await fetch('api.php?action=' + encodeURIComponent(action), { method: 'POST', body });
  const json = await res.json();
  return json;
}

async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  const res  = await fetch('api.php?' + qs);
  const json = await res.json();
  return json;
}

/* ============================================================
   LIVE DB — akan diisi dari api.php setelah login
   Strukturnya SAMA dengan mock DB agar semua render functions
   di app.js tetap berjalan tanpa perubahan
   ============================================================ */
const DB = {
  users:     [],
  kelompok:  [],
  tugas:     [],
  uploads:   [],
  penilaian: [],
};

async function loadDB() {
  const res = await apiGet('get_data');
  if (!res.ok) return;
  const d = res.data;

  // Normalise agar field-nya sama dengan mock DB yang dipakai app.js
  DB.users     = (d.users || []).map(u => ({ ...u, kelompok_id: u.kelompok_id ? +u.kelompok_id : null }));
  DB.kelompok  = (d.kelompok || []).map(k => ({ ...k, id: +k.id, dosen_id: k.dosen_id ? +k.dosen_id : null, progress: +k.progress }));
  DB.tugas     = (d.tugas || []).map(t => ({
    ...t,
    id:          +t.id,
    kelompok_id: +t.kelompok_id,
    assignee:    t.assignee_id ? +t.assignee_id : null, // app.js pakai t.assignee
    assignee_id: t.assignee_id ? +t.assignee_id : null,
  }));
  DB.uploads   = (d.uploads || []).map(u => ({
    ...u,
    id:          +u.id,
    kelompok_id: +u.kelompok_id,
    user_id:     +u.user_id,
    tugas_id:    u.tugas_id ? +u.tugas_id : null,
    tanggal:     u.uploaded_at || '',
    ukuran:      formatBytes(+u.ukuran),
    tipe:        (u.tipe || '').toUpperCase(),
    dataUrl:     null, // file real ada di server
  }));
  DB.penilaian = (d.penilaian || []).map(p => ({
    ...p,
    id:          +p.id,
    kelompok_id: +p.kelompok_id,
    dosen_id:    +p.dosen_id,
    nilai:       p.nilai !== null ? +p.nilai : null,
    tanggal:     p.dinilai_at || null,
  }));
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return Math.round(bytes / 1024) + ' KB';
}

/* ============================================================
   AUTH — override fungsi di app.js
   (di-load setelah app.js karena backend.js ini di-inject
    setelah app.js, tapi kita override di DOMContentLoaded)
   ============================================================ */

// Akan dipanggil oleh DOMContentLoaded override di bawah
async function doLogin(email, password) {
  const res = await apiPost('login', { email, password });
  if (res.ok) {
    currentUser = res.data;
    await loadDB();
    return true;
  }
  return false;
}

async function doLogout() {
  await apiPost('logout');
  currentUser = null;
  showPage('login');
}

async function doCheckSession() {
  // Cek dari window.__SMPM_SESSION__ yang di-inject oleh index.php
  const sess = window.__SMPM_SESSION__;
  if (sess) {
    currentUser = sess;
    await loadDB();
    return true;
  }
  return false;
}

async function doRegister() {
  const nama       = document.getElementById('reg-nama')?.value.trim();
  const nim        = document.getElementById('reg-nim')?.value.trim();
  const email      = document.getElementById('reg-email')?.value.trim();
  const kelompokId = document.getElementById('reg-kelompok')?.value;
  const password   = document.getElementById('reg-pass')?.value;
  const confirmPass= document.getElementById('reg-confirm')?.value;
  const errorDiv   = document.getElementById('register-error');
  const errorMsg   = document.getElementById('register-error-msg');

  const showErr = (msg) => {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorDiv) errorDiv.classList.remove('hidden');
  };

  if (!nama || !nim || !email || !kelompokId || !password || !confirmPass)
    return showErr('Semua field wajib diisi!');
  if (!email.includes('@kampus.ac.id'))
    return showErr('Email harus menggunakan @kampus.ac.id!');
  if (password.length < 6)
    return showErr('Password minimal 6 karakter!');
  if (password !== confirmPass)
    return showErr('Konfirmasi password tidak cocok!');

  const btn = document.querySelector('.reg-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar...'; }

  const res = await apiPost('register', { nama, nim, email, password, kelompok_id: kelompokId });

  if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Daftar Sekarang`; }

  if (!res.ok) return showErr(res.message || 'Pendaftaran gagal.');

  if (errorDiv) errorDiv.classList.add('hidden');
  currentUser = res.data;
  await loadDB();
  buildSidebar();
  showPage('dashboard');
  showToast('Akun berhasil dibuat! Selamat datang, ' + currentUser.nama, 'success');
}

/* ============================================================
   OVERRIDE — Tangkap DOMContentLoaded dari app.js dan
   ganti dengan versi async yang memanggil API
   ============================================================ */
window.addEventListener('load', () => {
  // Login form — override submit
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Hapus listener lama (clone trick)
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    newForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');
      const infoEl= document.getElementById('login-info');
      const btn   = newForm.querySelector('button[type="submit"]');

      if (btn) { btn.disabled = true; btn.textContent = 'Masuk...'; }

      const ok = await doLogin(email, pass);

      if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }

      if (ok) {
        if (errEl) errEl.classList.add('hidden');
        if (infoEl) infoEl.classList.add('hidden');
        buildSidebar();
        showPage('dashboard');
      } else {
        if (errEl) errEl.classList.remove('hidden');
        if (infoEl) infoEl.classList.add('hidden');
      }
    });
  }

  // Logout button — override
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    const newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    newBtn.addEventListener('click', doLogout);
  }

  // Register form — override submit
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const newReg = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(newReg, registerForm);
    newReg.addEventListener('submit', e => { e.preventDefault(); doRegister(); });
  }

  // Cek session dari PHP lalu masuk dashboard atau login
  doCheckSession().then(loggedIn => {
    if (loggedIn) {
      buildSidebar();
      showPage('dashboard');
    } else {
      showPage('login');
    }
  });
});

/* ============================================================
   OVERRIDE AKSI YANG MENYENTUH DB
   Ganti fungsi-fungsi yang write ke mock DB dengan API calls
   ============================================================ */

// Submit kumpulkan tugas (upload file ke server)
async function submitKumpulkan(tugasId) {
  const inp     = document.getElementById(`file-kumpulkan-${tugasId}`);
  const catatan = document.getElementById(`catatan-kumpulkan-${tugasId}`)?.value.trim();

  if (!inp || !inp.files || !inp.files.length) {
    showToast('Pilih file terlebih dahulu!', 'error'); return;
  }

  const file   = inp.files[0];
  const formData = new FormData();
  formData.append('action', 'upload_file');
  formData.append('tugas_id', tugasId);
  formData.append('file', file);
  if (catatan) formData.append('catatan', catatan);

  const btn = document.querySelector(`#modal-body .btn-primary`);
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }

  try {
    const res = await fetch('api.php?action=upload_file', { method: 'POST', body: formData });
    const json = await res.json();
    if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }

    // Update local DB
    await loadDB();
    closeModal();
    renderTugas();
    showToast(`Tugas berhasil dikumpulkan! File "${file.name}" diunggah.`, 'success');
  } catch(err) {
    showToast('Koneksi gagal. Coba lagi.', 'error');
  } finally {
    if (btn) { btn.disabled = false; }
  }
}

// Hapus upload
async function konfirmasiHapusUpload(uploadId) {
  const res = await apiPost('delete_upload', { id: uploadId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus.', 'error'); return; }
  await loadDB();
  closeModal();
  renderUpload();
  showToast('File berhasil dihapus!', 'success');
}

// Tambah tugas (dosen)
async function submitTambahTugas(kelompokId) {
  const judul      = document.getElementById(`tugas-judul-${kelompokId}`)?.value.trim();
  const assigneeId = document.getElementById(`tugas-assignee-${kelompokId}`)?.value || null;
  const deadline   = document.getElementById(`tugas-deadline-${kelompokId}`)?.value;
  const deskripsi  = document.getElementById(`tugas-deskripsi-${kelompokId}`)?.value.trim() || '';

  if (!judul || !deadline) { showToast('Judul dan deadline wajib diisi!', 'error'); return; }

  const res = await apiPost('add_tugas', { judul, kelompok_id: kelompokId, assignee_id: assigneeId, deadline, deskripsi });
  if (!res.ok) { showToast(res.message || 'Gagal menambah tugas.', 'error'); return; }

  await loadDB();
  closeModal();
  renderTugasDosen();
  showToast('Tugas berhasil ditambahkan!', 'success');
}

// Hapus tugas (dosen)
async function hapusTugas(tugasId) {
  const res = await apiPost('delete_tugas', { id: tugasId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus tugas.', 'error'); return; }
  await loadDB();
  renderTugasDosen();
  showToast('Tugas berhasil dihapus!', 'success');
}

// Simpan penilaian (dosen)
async function submitPenilaian(kelompokId) {
  const nilai    = document.getElementById(`nilai-input-${kelompokId}`)?.value;
  const feedback = document.getElementById(`feedback-input-${kelompokId}`)?.value.trim();
  if (!nilai) { showToast('Nilai wajib diisi!', 'error'); return; }
  const res = await apiPost('save_penilaian', { kelompok_id: kelompokId, nilai, feedback });
  if (!res.ok) { showToast(res.message || 'Gagal menyimpan penilaian.', 'error'); return; }
  await loadDB();
  renderPenilaian();
  showToast('Penilaian berhasil disimpan!', 'success');
}

// Admin: tambah user
async function submitTambahUser() {
  const nama       = document.getElementById('admin-user-nama')?.value.trim();
  const nim        = document.getElementById('admin-user-nim')?.value.trim();
  const email      = document.getElementById('admin-user-email')?.value.trim();
  const password   = document.getElementById('admin-user-pass')?.value;
  const role       = document.getElementById('admin-user-role')?.value;
  const kelompokId = document.getElementById('admin-user-kelompok')?.value || null;
  const res = await apiPost('add_user', { nama, nim, email, password, role, kelompok_id: kelompokId });
  if (!res.ok) { showToast(res.message || 'Gagal menambah user.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageUser();
  showToast('User berhasil ditambahkan!', 'success');
}

// Admin: hapus user
async function konfirmasiHapusUser(userId) {
  const res = await apiPost('delete_user', { id: userId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus user.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageUser();
  showToast('User berhasil dihapus!', 'success');
}

// Admin: tambah kelompok
async function submitTambahKelompok() {
  const nama     = document.getElementById('admin-kel-nama')?.value.trim();
  const tema     = document.getElementById('admin-kel-tema')?.value.trim();
  const dosenId  = document.getElementById('admin-kel-dosen')?.value || null;
  const status   = document.getElementById('admin-kel-status')?.value || 'aktif';
  const res = await apiPost('add_kelompok', { nama, tema, dosen_id: dosenId, status });
  if (!res.ok) { showToast(res.message || 'Gagal menambah kelompok.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil ditambahkan!', 'success');
}

// Admin: hapus kelompok
async function konfirmasiHapusKelompok(kelompokId) {
  const res = await apiPost('delete_kelompok', { id: kelompokId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus kelompok.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil dihapus!', 'success');
}

// Handle upload dari halaman Upload (bukan modal)
function handleUpload() {
  const tugasSelect = document.getElementById('upload-tugas');
  const input       = document.getElementById('upload-input');
  if (!tugasSelect?.value) { showToast('Pilih tugas terlebih dahulu!', 'error'); return; }
  if (!input?.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }

  const tugasId  = parseInt(tugasSelect.value);
  const file     = input.files[0];
  const formData = new FormData();
  formData.append('action', 'upload_file');
  formData.append('tugas_id', tugasId);
  formData.append('file', file);

  fetch('api.php?action=upload_file', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(async json => {
      if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
      await loadDB();
      input.value = '';
      tugasSelect.value = '';
      renderUpload();
      const tugas = DB.tugas.find(t => t.id === tugasId);
      showToast(`🎉 File berhasil diupload! Tugas "${tugas?.judul || ''}" otomatis selesai.`, 'success');
    })
    .catch(() => showToast('Koneksi gagal. Coba lagi.', 'error'));
}
