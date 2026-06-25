/* =============================================
   SMPM — patch.js
   Load SETELAH app.js.
   Tujuan: hubungkan ke api.php tanpa ubah tampilan.
   Fix: gunakan capture:true agar intercept sebelum
        listener bubble-phase dari app.js.
   ============================================= */

/* ============================================================
   API HELPERS
   ============================================================ */
function smpmPost(action, data) {
  var fd = new FormData();
  fd.append('action', action);
  if (data) {
    Object.keys(data).forEach(function(k) {
      if (data[k] !== null && data[k] !== undefined) fd.append(k, data[k]);
    });
  }
  return fetch('api.php?action=' + encodeURIComponent(action), {
    method: 'POST', body: fd
  }).then(function(r) { return r.json(); });
}

function smpmGet(action) {
  return fetch('api.php?action=' + encodeURIComponent(action))
    .then(function(r) { return r.json(); });
}

function smpmFmtBytes(b) {
  if (!b || isNaN(b)) return '0 KB';
  return +b >= 1048576 ? (+b / 1048576).toFixed(1) + ' MB' : Math.round(+b / 1024) + ' KB';
}

/* ============================================================
   ISI DB DARI API (timpa mock data app.js in-place)
   ============================================================ */
function smpmLoadDB() {
  return smpmGet('get_data').then(function(res) {
    if (!res.ok) return;
    var d = res.data;
    DB.users.length = 0;
    DB.kelompok.length = 0;
    DB.tugas.length = 0;
    DB.uploads.length = 0;
    DB.penilaian.length = 0;
    (d.users || []).forEach(function(u) {
      DB.users.push(Object.assign({}, u, { id: +u.id, kelompok_id: u.kelompok_id ? +u.kelompok_id : null }));
    });
    (d.kelompok || []).forEach(function(k) {
      DB.kelompok.push(Object.assign({}, k, { id: +k.id, dosen_id: k.dosen_id ? +k.dosen_id : null, progress: +k.progress, max_anggota: +(k.max_anggota || 5) }));
    });
    (d.tugas || []).forEach(function(t) {
      DB.tugas.push(Object.assign({}, t, { id: +t.id, kelompok_id: +t.kelompok_id, assignee: t.assignee_id ? +t.assignee_id : null, assignee_id: t.assignee_id ? +t.assignee_id : null, file: null }));
    });
    (d.uploads || []).forEach(function(u) {
      DB.uploads.push(Object.assign({}, u, { id: +u.id, kelompok_id: +u.kelompok_id, user_id: +u.user_id, tugas_id: u.tugas_id ? +u.tugas_id : null, tanggal: u.uploaded_at || '', ukuran: smpmFmtBytes(+u.ukuran), tipe: (u.tipe || '').toUpperCase(), dataUrl: null }));
    });
    (d.penilaian || []).forEach(function(p) {
      DB.penilaian.push(Object.assign({}, p, { id: +p.id, kelompok_id: +p.kelompok_id, dosen_id: +p.dosen_id, nilai: p.nilai != null ? +p.nilai : null, tanggal: p.dinilai_at || null }));
    });
  });
}

/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */
function toggleMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;
  var isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  } else {
    sidebar.classList.add('open');
    if (overlay) overlay.style.display = 'block';
  }
}

function closeMobileSidebar() {
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.style.display = 'none';
}

/* Tutup sidebar saat klik nav item di mobile */
function smpmPatchNavItems() {
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeMobileSidebar();
    });
  });
}

/* ============================================================
   PATCH FORMS — gunakan capture:true agar intercept
   SEBELUM listener bubble-phase dari app.js
   ============================================================ */
function smpmPatchForms() {

  /* --- LOGIN: capture phase memblokir listener app.js --- */
  var loginForm = document.getElementById('login-form');
  if (loginForm && !loginForm._smpmPatched) {
    loginForm._smpmPatched = true;
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation(); // blokir listener lain di elemen ini

      var email = ((document.getElementById('login-email') || {}).value || '').trim();
      var pass  = (document.getElementById('login-pass')   || {}).value || '';
      var errEl = document.getElementById('login-error');
      var infoEl= document.getElementById('login-info');
      var btn   = loginForm.querySelector('button[type="submit"]');

      if (errEl)  errEl.classList.add('hidden');
      if (infoEl) infoEl.classList.add('hidden');
      if (btn) { btn.disabled = true; btn.textContent = 'Masuk...'; }

      smpmPost('login', { email: email, password: pass })
        .then(function(res) {
          if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
          if (res.ok) {
            currentUser = res.data;
            smpmLoadDB().then(function() {
              buildSidebar();
              showPage('dashboard');
              smpmPatchNavItems();
            });
          } else {
            if (errEl) errEl.classList.remove('hidden');
          }
        })
        .catch(function() {
          if (btn) { btn.disabled = false; btn.textContent = 'Masuk'; }
          if (errEl) errEl.classList.remove('hidden');
        });
    }, true); // capture: true = jalan sebelum listener app.js
  }

  /* --- LOGOUT --- */
  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && !logoutBtn._smpmPatched) {
    logoutBtn._smpmPatched = true;
    // clone untuk hapus listener lama app.js
    var newBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
    newBtn.addEventListener('click', function() {
      smpmPost('logout').finally(function() {
        currentUser = null;
        showPage('login');
        // Re-patch setelah halaman login tampil
        setTimeout(smpmPatchForms, 100);
      });
    });
  }

  /* --- REGISTER --- */
  var regForm = document.getElementById('register-form');
  if (regForm && !regForm._smpmPatched) {
    regForm._smpmPatched = true;
    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      smpmHandleRegister();
    }, true); // capture: true
  }

  smpmPatchRegisterPage();
}

/* Patch showRegisterPage agar dropdown kelompok dari DB real */
function smpmPatchRegisterPage() {
  var origShow = window.showRegisterPage;
  if (origShow && !origShow._smpmPatched) {
    window.showRegisterPage = function() {
      origShow();
      var sel = document.getElementById('reg-kelompok');
      if (sel) {
        sel.innerHTML = '<option value="">— Pilih kelompok Anda —</option>' +
          DB.kelompok.filter(function(k) { return k.status === 'aktif'; })
            .map(function(k) { return '<option value="' + k.id + '">' + k.nama + ' — ' + k.tema + '</option>'; })
            .join('');
      }
    };
    window.showRegisterPage._smpmPatched = true;
  }
}

/* ============================================================
   INIT
   ============================================================ */
// Patch forms SEGERA saat script ini jalan (setelah DOMContentLoaded app.js selesai)
smpmPatchForms();

(function smpmInit() {
  var sess = window.__SMPM_SESSION__;
  if (sess) {
    currentUser = sess;
    smpmLoadDB().then(function() {
      buildSidebar();
      showPage('dashboard');
      smpmPatchNavItems();
    });
  } else {
    showPage('login');
    smpmPatchRegisterPage();
  }
})();

/* ============================================================
   REGISTER via API
   ============================================================ */
function smpmHandleRegister() {
  var nama        = ((document.getElementById('reg-nama')    || {}).value || '').trim();
  var nim         = ((document.getElementById('reg-nim')     || {}).value || '').trim();
  var email       = ((document.getElementById('reg-email')   || {}).value || '').trim();
  var kelompokId  = (document.getElementById('reg-kelompok') || {}).value || '';
  var password    = (document.getElementById('reg-pass')     || {}).value || '';
  var confirmPass = (document.getElementById('reg-confirm')  || {}).value || '';
  var errorDiv    = document.getElementById('register-error');
  var errorMsg    = document.getElementById('register-error-msg');

  function showErr(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorDiv) errorDiv.classList.remove('hidden');
  }

  if (!nama || !nim || !email || !kelompokId || !password || !confirmPass) return showErr('Semua field wajib diisi!');
  if (!email.includes('@kampus.ac.id'))  return showErr('Email harus menggunakan @kampus.ac.id!');
  if (password.length < 6)              return showErr('Password minimal 6 karakter!');
  if (password !== confirmPass)         return showErr('Konfirmasi password tidak cocok!');

  var btn = document.querySelector('.reg-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar...'; }

  smpmPost('register', { nama: nama, nim: nim, email: email, password: password, kelompok_id: kelompokId })
    .then(function(res) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> Daftar Sekarang';
      }
      if (!res.ok) return showErr(res.message || 'Pendaftaran gagal.');
      if (errorDiv) errorDiv.classList.add('hidden');
      currentUser = res.data;
      smpmLoadDB().then(function() {
        buildSidebar();
        showPage('dashboard');
        smpmPatchNavItems();
        showToast('Akun berhasil dibuat! Selamat datang, ' + currentUser.nama, 'success');
      });
    })
    .catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Daftar Sekarang'; }
      showErr('Koneksi gagal. Coba lagi.');
    });
}

/* ============================================================
   CRUD OVERRIDES
   ============================================================ */

/* USER */
function submitAddUser() {
  var nama  = ((document.getElementById('add-nama')  || {}).value || '').trim();
  var nim   = ((document.getElementById('add-nim')   || {}).value || '').trim();
  var email = ((document.getElementById('add-email') || {}).value || '').trim();
  var pass  = (document.getElementById('add-pass')   || {}).value || '';
  var role  = (document.getElementById('add-role')   || {}).value || 'mahasiswa';
  var kelSel = document.getElementById('add-kelompok');
  var kelId  = (role === 'mahasiswa' && kelSel && kelSel.value) ? kelSel.value : null;
  if (!nama || !nim || !email || !pass) { showToast('Semua field wajib diisi', 'error'); return; }
  if (role === 'mahasiswa' && !kelId)  { showToast('Mahasiswa harus memilih kelompok!', 'error'); return; }
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('add_user', { nama: nama, nim: nim, email: email, password: pass, role: role, kelompok_id: kelId })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan User'; }
      if (!res.ok) { showToast(res.message || 'Gagal menambah user.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderManageUser(); showToast('User berhasil ditambahkan!', 'success'); });
    });
}

function submitEditUser(userId) {
  var nama  = ((document.getElementById('edit-nama')  || {}).value || '').trim();
  var nim   = ((document.getElementById('edit-nim')   || {}).value || '').trim();
  var email = ((document.getElementById('edit-email') || {}).value || '').trim();
  var pass  = (document.getElementById('edit-pass')   || {}).value || '';
  var role  = (document.getElementById('edit-role')   || {}).value || 'mahasiswa';
  var kelSel = document.getElementById('edit-kelompok');
  var kelId  = (role === 'mahasiswa' && kelSel && kelSel.value) ? kelSel.value : null;
  if (!nama || !nim || !email) { showToast('Nama, NIM, Email wajib diisi', 'error'); return; }
  var payload = { id: userId, nama: nama, nim: nim, email: email, role: role, kelompok_id: kelId };
  if (pass) payload.password = pass;
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('update_user', payload).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
    if (!res.ok) { showToast(res.message || 'Gagal update user.', 'error'); return; }
    if (+userId === +currentUser.id) { currentUser = Object.assign({}, currentUser, res.data); buildSidebar(); }
    smpmLoadDB().then(function() { closeModal(); renderManageUser(); showToast('User berhasil diperbarui!', 'success'); });
  });
}

function deleteUser(id) {
  if (+id === +currentUser.id) { showToast('Tidak bisa hapus akun sendiri', 'error'); return; }
  smpmPost('delete_user', { id: id }).then(function(res) {
    if (!res.ok) { showToast(res.message || 'Gagal hapus user.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderManageUser(); showToast('User berhasil dihapus!', 'success'); });
  });
}

/* KELOMPOK */
function simpanKelompokBaru() {
  var nama    = ((document.getElementById('kk-nama')  || {}).value || '').trim();
  var tema    = ((document.getElementById('kk-tema')  || {}).value || '').trim();
  var dosenId = (document.getElementById('kk-dosen')  || {}).value || null;
  if (!nama) { showToast('Nama kelompok wajib!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib!', 'error'); return; }
  if (DB.kelompok.find(function(k) { return k.nama.toLowerCase() === nama.toLowerCase(); })) {
    showToast('Nama "' + nama + '" sudah digunakan!', 'error'); return;
  }
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('add_kelompok', { nama: nama, tema: tema, dosen_id: dosenId, status: 'aktif' }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
    if (!res.ok) { showToast(res.message || 'Gagal tambah kelompok.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok "' + nama + '" berhasil ditambahkan!', 'success'); });
  });
}

function updateKelompok(kelompokId) {
  var nama     = ((document.getElementById('ek-nama')     || {}).value || '').trim();
  var tema     = ((document.getElementById('ek-tema')     || {}).value || '').trim();
  var dosenId  = (document.getElementById('ek-dosen')     || {}).value || null;
  var progress = parseInt((document.getElementById('ek-progress') || {}).value) || 0;
  var status   = (document.getElementById('ek-status')    || {}).value || 'aktif';
  if (!nama) { showToast('Nama kelompok wajib!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib!', 'error'); return; }
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('update_kelompok', { id: kelompokId, nama: nama, tema: tema, dosen_id: dosenId, progress: progress, status: status }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
    if (!res.ok) { showToast(res.message || 'Gagal update kelompok.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok berhasil diperbarui!', 'success'); });
  });
}

function konfirmasiHapusKelompok(kelompokId) {
  smpmPost('delete_kelompok', { id: kelompokId }).then(function(res) {
    if (!res.ok) { showToast(res.message || 'Gagal hapus kelompok.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok berhasil dihapus!', 'success'); });
  });
}

/* TUGAS */
function submitTambahTugas(kelompokId) {
  var judul     = ((document.getElementById('tt-judul')    || {}).value || '').trim();
  var assignee  = (document.getElementById('tt-assignee')  || {}).value || null;
  var deadline  = (document.getElementById('tt-deadline')  || {}).value || '';
  var status    = (document.getElementById('tt-status')    || {}).value || 'pending';
  var deskripsi = ((document.getElementById('tt-desc')     || {}).value || '').trim();
  if (!judul)    { showToast('Judul tugas wajib!', 'error'); return; }
  if (!deadline) { showToast('Deadline wajib!', 'error'); return; }
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('add_tugas', { judul: judul, kelompok_id: kelompokId, assignee_id: assignee, deadline: deadline, status: status, deskripsi: deskripsi }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas'; }
    if (!res.ok) { showToast(res.message || 'Gagal tambah tugas.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderTugasDosen(); showToast('Tugas "' + judul + '" berhasil ditambahkan!', 'success'); });
  });
}

function confirmHapusTugas(tugasId) {
  smpmPost('delete_tugas', { id: tugasId }).then(function(res) {
    if (!res.ok) { showToast(res.message || 'Gagal hapus tugas.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderTugasDosen(); showToast('Tugas berhasil dihapus!', 'success'); });
  });
}

/* PENILAIAN */
function simpanNilai(kelompokId) {
  var nilaiEl    = document.getElementById('nilai-' + kelompokId);
  var feedbackEl = document.getElementById('feedback-' + kelompokId);
  var nilaiVal   = nilaiEl ? parseInt(nilaiEl.value) : null;
  var feedback   = feedbackEl ? feedbackEl.value.trim() : '';
  if (!nilaiEl || !nilaiEl.value) { showToast('Masukkan nilai terlebih dahulu!', 'error'); return; }
  if (isNaN(nilaiVal) || nilaiVal < 0 || nilaiVal > 100) { showToast('Nilai harus antara 0-100!', 'error'); return; }
  smpmPost('save_penilaian', { kelompok_id: kelompokId, nilai: nilaiVal, feedback: feedback }).then(function(res) {
    if (!res.ok) { showToast(res.message || 'Gagal simpan penilaian.', 'error'); return; }
    smpmLoadDB().then(function() {
      var gradeEl = document.getElementById('grade-' + kelompokId);
      if (gradeEl) {
        gradeEl.innerHTML = nilaiVal >= 85 ? '<span class="badge badge-green">A</span>'
          : nilaiVal >= 70 ? '<span class="badge badge-navy">B</span>'
          : nilaiVal >= 55 ? '<span class="badge badge-amber">C</span>'
          : '<span class="badge badge-red">D</span>';
      }
      showToast('Nilai berhasil disimpan!', 'success');
    });
  });
}

/* UPLOAD */
function submitKumpulkan(tugasId) {
  var inp     = document.getElementById('file-kumpulkan-' + tugasId);
  var catatan = ((document.getElementById('catatan-kumpulkan-' + tugasId) || {}).value || '').trim();
  if (!inp || !inp.files || !inp.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }
  var fd = new FormData();
  fd.append('action', 'upload_file');
  fd.append('tugas_id', tugasId);
  fd.append('file', inp.files[0]);
  if (catatan) fd.append('catatan', catatan);
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }
  fetch('api.php?action=upload_file', { method: 'POST', body: fd })
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (btn) btn.disabled = false;
      if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderTugas(); showToast('Tugas berhasil dikumpulkan! File "' + inp.files[0].name + '" diunggah.', 'success'); });
    })
    .catch(function() { if (btn) btn.disabled = false; showToast('Koneksi gagal.', 'error'); });
}

function handleUpload() {
  var tugasSel = document.getElementById('upload-tugas');
  var input    = document.getElementById('upload-input');
  if (!tugasSel || !tugasSel.value) { showToast('Pilih tugas terlebih dahulu!', 'error'); return; }
  if (!input || !input.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }
  var fd = new FormData();
  fd.append('action', 'upload_file');
  fd.append('tugas_id', parseInt(tugasSel.value));
  fd.append('file', input.files[0]);
  fetch('api.php?action=upload_file', { method: 'POST', body: fd })
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
      smpmLoadDB().then(function() { input.value = ''; tugasSel.value = ''; renderUpload(); showToast('File berhasil diupload!', 'success'); });
    })
    .catch(function() { showToast('Koneksi gagal.', 'error'); });
}

function konfirmasiHapusUpload(uploadId) {
  smpmPost('delete_upload', { id: uploadId }).then(function(res) {
    if (!res.ok) { showToast(res.message || 'Gagal hapus.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderUpload(); showToast('File berhasil dihapus!', 'success'); });
  });
}
