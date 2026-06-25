/* =============================================
   SMPM — Backend POST (load SETELAH app.js)
   Override semua CRUD + init async
   ============================================= */
'use strict';

/* ---- API helpers (full version) ---- */
async function apiPost(action, data = {}) {
  const body = new FormData();
  body.append('action', action);
  for (const [k, v] of Object.entries(data)) {
    if (v !== null && v !== undefined) body.append(k, v);
  }
  const res = await fetch('api.php?action=' + encodeURIComponent(action), { method: 'POST', body });
  return res.json();
}
async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  const res = await fetch('api.php?' + qs);
  return res.json();
}

/* ============================================================
   INIT UTAMA — jalankan setelah semua script ter-load
   Gantikan DOMContentLoaded dari app.js
   ============================================================ */
window.addEventListener('load', async () => {

  /* -- Override logout button -- */
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    const nb = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(nb, logoutBtn);
    nb.addEventListener('click', async () => {
      await apiPost('logout');
      currentUser = null;
      window.__SMPM_SESSION__ = null;
      showPage('login');
    });
  }

  /* -- Override register form -- */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const nr = registerForm.cloneNode(true);
    registerForm.parentNode.replaceChild(nr, registerForm);
    nr.addEventListener('submit', e => { e.preventDefault(); doRegister(); });
  }

  /* -- Override login form (async) -- */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const nl = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(nl, loginForm);
    nl.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');
      const btn   = nl.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Masuk...'; }

      const res = await apiPost('login', { email, password: pass });
      if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }

      if (res.ok) {
        currentUser = res.data;
        window.__SMPM_SESSION__ = res.data;
        if (errEl) errEl.classList.add('hidden');
        await loadDB();
        buildSidebar();
        showPage('dashboard');
      } else {
        if (errEl) errEl.classList.remove('hidden');
      }
    });
  }

  /* -- Cek session & load data -- */
  const sess = window.__SMPM_SESSION__;
  if (sess) {
    currentUser = sess;
    await loadDB();
    buildSidebar();
    showPage('dashboard');
  } else {
    showPage('login');
  }

  /* -- Populate kelompok di dropdown register -- */
  _patchShowRegisterPage();
});

/* Patch showRegisterPage agar dropdown kelompok dari DB real */
function _patchShowRegisterPage() {
  const orig = window.showRegisterPage;
  window.showRegisterPage = function() {
    if (orig) orig();
    const sel = document.getElementById('reg-kelompok');
    if (sel && DB.kelompok.length) {
      sel.innerHTML = '<option value="">— Pilih kelompok Anda —</option>' +
        DB.kelompok.filter(k => k.status === 'aktif')
          .map(k => `<option value="${k.id}">${k.nama} — ${k.tema}</option>`)
          .join('');
    }
  };
}

/* ============================================================
   REGISTER
   ============================================================ */
async function doRegister() {
  const nama        = document.getElementById('reg-nama')?.value.trim();
  const nim         = document.getElementById('reg-nim')?.value.trim();
  const email       = document.getElementById('reg-email')?.value.trim();
  const kelompokId  = document.getElementById('reg-kelompok')?.value;
  const password    = document.getElementById('reg-pass')?.value;
  const confirmPass = document.getElementById('reg-confirm')?.value;
  const errorDiv    = document.getElementById('register-error');
  const errorMsg    = document.getElementById('register-error-msg');

  const showErr = msg => {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorDiv) errorDiv.classList.remove('hidden');
  };

  if (!nama || !nim || !email || !kelompokId || !password || !confirmPass) return showErr('Semua field wajib diisi!');
  if (!email.includes('@kampus.ac.id'))  return showErr('Email harus menggunakan @kampus.ac.id!');
  if (password.length < 6)              return showErr('Password minimal 6 karakter!');
  if (password !== confirmPass)         return showErr('Konfirmasi password tidak cocok!');

  const btn = document.querySelector('.reg-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar...'; }

  const res = await apiPost('register', { nama, nim, email, password, kelompok_id: kelompokId });

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Daftar Sekarang`;
  }
  if (!res.ok) return showErr(res.message || 'Pendaftaran gagal.');

  if (errorDiv) errorDiv.classList.add('hidden');
  currentUser = res.data;
  window.__SMPM_SESSION__ = res.data;
  await loadDB();
  buildSidebar();
  showPage('dashboard');
  showToast('Akun berhasil dibuat! Selamat datang, ' + currentUser.nama, 'success');
}

/* ============================================================
   OVERRIDE CRUD USER
   ============================================================ */
async function submitAddUser() {
  const nama        = document.getElementById('add-nama')?.value.trim();
  const nim         = document.getElementById('add-nim')?.value.trim();
  const email       = document.getElementById('add-email')?.value.trim();
  const pass        = document.getElementById('add-pass')?.value;
  const role        = document.getElementById('add-role')?.value || 'mahasiswa';
  const kelompokSel = document.getElementById('add-kelompok');
  const kelompokId  = (role === 'mahasiswa' && kelompokSel?.value) ? kelompokSel.value : null;

  if (!nama || !nim || !email || !pass) { showToast('Semua field wajib diisi', 'error'); return; }
  if (role === 'mahasiswa' && !kelompokId) { showToast('Mahasiswa harus memilih kelompok!', 'error'); return; }

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const res = await apiPost('add_user', { nama, nim, email, password: pass, role, kelompok_id: kelompokId });

  if (btn) { btn.disabled = false; btn.textContent = 'Simpan User'; }
  if (!res.ok) { showToast(res.message || 'Gagal menambah user.', 'error'); return; }

  await loadDB();
  closeModal();
  renderManageUser();
  showToast('User berhasil ditambahkan!', 'success');
}

async function submitEditUser(userId) {
  const nama        = document.getElementById('edit-nama')?.value.trim();
  const nim         = document.getElementById('edit-nim')?.value.trim();
  const email       = document.getElementById('edit-email')?.value.trim();
  const pass        = document.getElementById('edit-pass')?.value;
  const role        = document.getElementById('edit-role')?.value || 'mahasiswa';
  const kelompokSel = document.getElementById('edit-kelompok');
  const kelompokId  = (role === 'mahasiswa' && kelompokSel?.value) ? kelompokSel.value : null;

  if (!nama || !nim || !email) { showToast('Nama, NIM, dan Email wajib diisi', 'error'); return; }

  const payload = { id: userId, nama, nim, email, role, kelompok_id: kelompokId };
  if (pass) payload.password = pass;

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const res = await apiPost('update_user', payload);

  if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
  if (!res.ok) { showToast(res.message || 'Gagal memperbarui user.', 'error'); return; }

  if (+userId === +currentUser.id) {
    currentUser = { ...currentUser, ...res.data };
    window.__SMPM_SESSION__ = currentUser;
    buildSidebar();
  }

  await loadDB();
  closeModal();
  renderManageUser();
  showToast('User berhasil diperbarui!', 'success');
}

async function deleteUser(id) {
  if (+id === +currentUser.id) { showToast('Tidak bisa menghapus akun sendiri', 'error'); return; }
  const res = await apiPost('delete_user', { id });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus user.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageUser();
  showToast('User berhasil dihapus!', 'success');
}

async function submitTambahUser() { await submitAddUser(); }
async function konfirmasiHapusUser(userId) { await deleteUser(userId); }

/* ============================================================
   OVERRIDE CRUD KELOMPOK
   ============================================================ */
async function simpanKelompokBaru() {
  const nama    = document.getElementById('kk-nama')?.value.trim();
  const tema    = document.getElementById('kk-tema')?.value.trim();
  const dosenId = document.getElementById('kk-dosen')?.value || null;

  if (!nama) { showToast('Nama kelompok wajib diisi!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib diisi!', 'error'); return; }
  if (DB.kelompok.find(k => k.nama.toLowerCase() === nama.toLowerCase())) {
    showToast(`Nama "${nama}" sudah digunakan!`, 'error'); return;
  }

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const res = await apiPost('add_kelompok', { nama, tema, dosen_id: dosenId, status: 'aktif' });

  if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
  if (!res.ok) { showToast(res.message || 'Gagal menambah kelompok.', 'error'); return; }

  await loadDB();
  closeModal();
  renderManageKelompok();
  showToast(`Kelompok "${nama}" berhasil ditambahkan!`, 'success');
}

async function updateKelompok(kelompokId) {
  const nama     = document.getElementById('ek-nama')?.value.trim();
  const tema     = document.getElementById('ek-tema')?.value.trim();
  const dosenId  = document.getElementById('ek-dosen')?.value || null;
  const progress = parseInt(document.getElementById('ek-progress')?.value) || 0;
  const status   = document.getElementById('ek-status')?.value || 'aktif';

  if (!nama) { showToast('Nama kelompok wajib diisi!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib diisi!', 'error'); return; }

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const res = await apiPost('update_kelompok', { id: kelompokId, nama, tema, dosen_id: dosenId, progress, status });

  if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
  if (!res.ok) { showToast(res.message || 'Gagal memperbarui kelompok.', 'error'); return; }

  await loadDB();
  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil diperbarui!', 'success');
}

async function konfirmasiHapusKelompok(kelompokId) {
  const res = await apiPost('delete_kelompok', { id: kelompokId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus kelompok.', 'error'); return; }
  await loadDB();
  closeModal();
  renderManageKelompok();
  showToast('Kelompok berhasil dihapus!', 'success');
}

async function submitTambahKelompok() { await simpanKelompokBaru(); }

/* ============================================================
   OVERRIDE CRUD TUGAS
   ============================================================ */
async function submitTambahTugas(kelompokId) {
  const judul    = document.getElementById('tt-judul')?.value.trim();
  const assignee = document.getElementById('tt-assignee')?.value || null;
  const deadline = document.getElementById('tt-deadline')?.value;
  const status   = document.getElementById('tt-status')?.value || 'pending';
  const deskripsi= document.getElementById('tt-desc')?.value.trim() || '';

  if (!judul)    { showToast('Judul tugas wajib diisi!', 'error'); return; }
  if (!deadline) { showToast('Deadline wajib diisi!', 'error'); return; }

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  const res = await apiPost('add_tugas', { judul, kelompok_id: kelompokId, assignee_id: assignee, deadline, status, deskripsi });

  if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas'; }
  if (!res.ok) { showToast(res.message || 'Gagal menambah tugas.', 'error'); return; }

  await loadDB();
  closeModal();
  renderTugasDosen();
  showToast(`Tugas "${judul}" berhasil ditambahkan!`, 'success');
}

async function confirmHapusTugas(tugasId, kelompokId) {
  const res = await apiPost('delete_tugas', { id: tugasId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus tugas.', 'error'); return; }
  await loadDB();
  closeModal();
  renderTugasDosen();
  showToast('Tugas berhasil dihapus!', 'success');
}

/* ============================================================
   OVERRIDE PENILAIAN
   ============================================================ */
async function simpanNilai(kelompokId) {
  const nilaiInput    = document.getElementById(`nilai-${kelompokId}`);
  const feedbackInput = document.getElementById(`feedback-${kelompokId}`);
  const nilaiVal      = nilaiInput ? parseInt(nilaiInput.value) : null;
  const feedbackVal   = feedbackInput ? feedbackInput.value.trim() : '';

  if (!nilaiInput?.value)                            { showToast('Masukkan nilai terlebih dahulu!', 'error'); return; }
  if (isNaN(nilaiVal) || nilaiVal < 0 || nilaiVal > 100) { showToast('Nilai harus antara 0-100!', 'error'); return; }

  const res = await apiPost('save_penilaian', { kelompok_id: kelompokId, nilai: nilaiVal, feedback: feedbackVal });
  if (!res.ok) { showToast(res.message || 'Gagal menyimpan penilaian.', 'error'); return; }

  await loadDB();
  const gradeEl = document.getElementById(`grade-${kelompokId}`);
  if (gradeEl) {
    gradeEl.innerHTML = nilaiVal >= 85 ? '<span class="badge badge-green">A</span>'
      : nilaiVal >= 70 ? '<span class="badge badge-navy">B</span>'
      : nilaiVal >= 55 ? '<span class="badge badge-amber">C</span>'
      : '<span class="badge badge-red">D</span>';
  }
  showToast('Nilai berhasil disimpan!', 'success');
}

async function submitPenilaian(kelompokId) { await simpanNilai(kelompokId); }

/* ============================================================
   OVERRIDE UPLOAD TUGAS (kumpulkan + halaman upload)
   ============================================================ */
async function submitKumpulkan(tugasId) {
  const inp     = document.getElementById(`file-kumpulkan-${tugasId}`);
  const catatan = document.getElementById(`catatan-kumpulkan-${tugasId}`)?.value.trim();

  if (!inp?.files?.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }

  const formData = new FormData();
  formData.append('action', 'upload_file');
  formData.append('tugas_id', tugasId);
  formData.append('file', inp.files[0]);
  if (catatan) formData.append('catatan', catatan);

  const btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }

  try {
    const res  = await fetch('api.php?action=upload_file', { method: 'POST', body: formData });
    const json = await res.json();
    if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
    await loadDB();
    closeModal();
    renderTugas();
    showToast(`Tugas berhasil dikumpulkan! File "${inp.files[0].name}" diunggah.`, 'success');
  } catch { showToast('Koneksi gagal. Coba lagi.', 'error'); }
  finally { if (btn) btn.disabled = false; }
}

function handleUpload() {
  const tugasSelect = document.getElementById('upload-tugas');
  const input       = document.getElementById('upload-input');
  if (!tugasSelect?.value) { showToast('Pilih tugas terlebih dahulu!', 'error'); return; }
  if (!input?.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }

  const formData = new FormData();
  formData.append('action', 'upload_file');
  formData.append('tugas_id', parseInt(tugasSelect.value));
  formData.append('file', input.files[0]);

  fetch('api.php?action=upload_file', { method: 'POST', body: formData })
    .then(r => r.json())
    .then(async json => {
      if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
      await loadDB();
      input.value = ''; tugasSelect.value = '';
      renderUpload();
      const tugas = DB.tugas.find(t => t.id === +tugasSelect.value);
      showToast(`🎉 File berhasil diupload!`, 'success');
    })
    .catch(() => showToast('Koneksi gagal. Coba lagi.', 'error'));
}

async function konfirmasiHapusUpload(uploadId) {
  const res = await apiPost('delete_upload', { id: uploadId });
  if (!res.ok) { showToast(res.message || 'Gagal menghapus.', 'error'); return; }
  await loadDB();
  closeModal();
  renderUpload();
  showToast('File berhasil dihapus!', 'success');
}
