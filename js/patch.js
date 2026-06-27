/* =============================================
   SMPM — patch.js
   Load SETELAH app.js.
   Tujuan: hubungkan ke api.php tanpa ubah tampilan.
   Fix: gunakan capture:true agar intercept sebelum
        listener bubble-phase dari app.js.
   ============================================= */

/* ============================================================
   BLOCK APP.JS SESSION BYPASS
   Override checkSession() SEBELUM DOMContentLoaded app.js
   jalan agar app.js tidak bisa baca sessionStorage dan
   langsung masuk dashboard tanpa verifikasi server.
   ============================================================ */
sessionStorage.removeItem('smpm_user');
window.checkSession = function() { return false; };

// Override fungsi logout() bawaan app.js agar selalu hit server
window.logout = function() {
  sessionStorage.removeItem('smpm_user');
  fetch(_smpmBase + 'api.php?action=logout', { method: 'POST' })
    .finally(function() {
      currentUser = null;
      if (typeof smpmGoToLogin === 'function') smpmGoToLogin();
      else window.location.reload();
    });
};

/* ============================================================
   API HELPERS
   ============================================================ */

// Base URL: pakai origin + pathname agar benar di semua environment
var _smpmBase = (function() {
  var p = window.location.pathname;
  // Ambil direktori: /SMPM/ atau / (Railway root)
  var dir = p.substring(0, p.lastIndexOf('/') + 1);
  return window.location.origin + dir;
})();

function smpmFetch(url, opts, retries) {
  retries = retries === undefined ? 3 : retries;
  // Buat fresh opts tiap call agar signal tidak expired saat retry
  var fetchOpts = Object.assign({ credentials: 'include' }, opts || {});
  // Hapus signal lama (akan dibuat baru tiap attempt)
  delete fetchOpts.signal;

  function attempt(n) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function() { controller.abort(); }, 60000) : null;
    var attemptOpts = Object.assign({}, fetchOpts);
    if (controller) attemptOpts.signal = controller.signal;

    return fetch(url, attemptOpts)
      .then(function(r) {
        if (timer) clearTimeout(timer);
        return r;
      })
      .catch(function(err) {
        if (timer) clearTimeout(timer);
        // AbortError = timeout, jangan retry kalau file upload (POST with body)
        var isUpload = fetchOpts.body instanceof FormData;
        if (n > 0 && !(err.name === 'AbortError' && isUpload)) {
          var delay = 1500 * (4 - n); // 1.5s, 3s, 4.5s
          return new Promise(function(resolve) { setTimeout(resolve, delay); })
            .then(function() { return attempt(n - 1); });
        }
        throw err;
      });
  }
  return attempt(retries);
}

function smpmPost(action, data) {
  var fd = new FormData();
  fd.append('action', action);
  if (data) {
    Object.keys(data).forEach(function(k) {
      if (data[k] !== null && data[k] !== undefined) fd.append(k, data[k]);
    });
  }
  return smpmFetch(_smpmBase + 'api.php?action=' + encodeURIComponent(action), {
    method: 'POST', body: fd
  }).then(function(r) {
    var ct = r.headers.get('Content-Type') || '';
    if (ct.indexOf('application/json') === -1) {
      return r.text().then(function(txt) {
        throw new Error('Server error (' + r.status + '): ' + txt.substring(0, 200));
      });
    }
    return r.json();
  });
}

function smpmGet(action) {
  return smpmFetch(_smpmBase + 'api.php?action=' + encodeURIComponent(action))
    .then(function(r) {
      var ct = r.headers.get('Content-Type') || '';
      if (ct.indexOf('application/json') === -1) {
        return r.text().then(function(txt) {
          throw new Error('Server error (' + r.status + '): ' + txt.substring(0, 200));
        });
      }
      return r.json();
    });
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
      DB.kelompok.push(Object.assign({}, k, {
        id: +k.id,
        dosen_id: k.dosen_id ? +k.dosen_id : null,
        progress: +k.progress,
        max_anggota: +(k.max_anggota || 7),
        jumlah_anggota: +(k.jumlah_anggota || 0)
      }));
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
  }).catch(function(err) {
    // Jangan biarkan loadDB error mematikan seluruh UI
    // Data lokal tetap terpakai
    console.warn('smpmLoadDB failed:', err && err.message);
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

  /* --- LOGOUT: event delegation di sidebar-footer agar
        tahan terhadap buildSidebar() yang merender ulang DOM --- */
  var sidebarFooter = document.querySelector('.sidebar-footer');
  if (sidebarFooter && !sidebarFooter._smpmLogoutPatched) {
    sidebarFooter._smpmLogoutPatched = true;
    sidebarFooter.addEventListener('click', function(e) {
      // Cari tombol logout yang diklik (bisa klik icon atau teks di dalamnya)
      var btn = e.target.closest('#logout-btn');
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      btn.disabled = true;
      btn.style.opacity = '0.6';
      smpmPost('logout')
        .finally(function() {
          currentUser = null;
          sessionStorage.removeItem('smpm_user');
          smpmGoToLogin();
          setTimeout(function() {
            btn.disabled = false;
            btn.style.opacity = '';
            smpmPatchForms();
          }, 100);
        });
    }, true); // capture: true agar intercept sebelum app.js
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
      // Kosongkan semua field form daftar
      ['reg-nama','reg-nim','reg-email','reg-pass','reg-confirm'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
      // Sembunyikan pesan error
      var errDiv = document.getElementById('register-error');
      if (errDiv) errDiv.classList.add('hidden');

      // Set loading state di dropdown dulu
      var sel = document.getElementById('reg-kelompok');
      if (sel) {
        sel.innerHTML = '<option value="">⏳ Memuat data kelompok...</option>';
        sel.disabled = true;
      }

      // Fetch data FRESH dari server agar jumlah anggota akurat
      smpmGet('get_data').then(function(res) {
        if (!res.ok || !res.data) throw new Error('Gagal ambil data');

        // Update DB lokal dengan data fresh
        var d = res.data;
        DB.kelompok.length = 0;
        (d.kelompok || []).forEach(function(k) {
          DB.kelompok.push(Object.assign({}, k, {
            id: +k.id, dosen_id: k.dosen_id ? +k.dosen_id : null,
            progress: +k.progress,
            max_anggota: +(k.max_anggota || 7),
            jumlah_anggota: +(k.jumlah_anggota || 0)
          }));
        });
        DB.users.length = 0;
        (d.users || []).forEach(function(u) {
          DB.users.push(Object.assign({}, u, {
            id: +u.id, kelompok_id: u.kelompok_id ? +u.kelompok_id : null
          }));
        });

        if (!sel) return;
        sel.disabled = false;

        var tersedia = DB.kelompok.filter(function(k) {
          return k.status === 'aktif' && +(k.jumlah_anggota || 0) < +(k.max_anggota || 7);
        });
        var penuhList = DB.kelompok.filter(function(k) {
          return k.status === 'aktif' && +(k.jumlah_anggota || 0) >= +(k.max_anggota || 7);
        });

        var html = '<option value="">— Pilih kelompok Anda —</option>';
        if (tersedia.length > 0) {
          html += '<optgroup label="✅ Tersedia">' +
            tersedia.map(function(k) {
              return '<option value="' + k.id + '">' + k.nama + ' – ' + k.tema + '</option>';
            }).join('') + '</optgroup>';
        }
        if (penuhList.length > 0) {
          html += '<optgroup label="🔒 Penuh (tidak bisa dipilih)">' +
            penuhList.map(function(k) {
              return '<option value="' + k.id + '" disabled>' + k.nama + ' – ' + k.tema + ' (Penuh)</option>';
            }).join('') + '</optgroup>';
        }
        sel.innerHTML = html;

        // Validasi tambahan saat user coba pilih kelompok penuh
        sel.addEventListener('change', function() {
          var selectedId = +sel.value;
          var kel = DB.kelompok.find(function(k) { return +k.id === selectedId; });
          if (kel && +(kel.jumlah_anggota || 0) >= +(kel.max_anggota || 7)) {
            showToast('Kelompok ini sudah penuh, pilih kelompok lain!', 'error');
            sel.value = '';
          }
        });

      }).catch(function() {
        if (!sel) return;
        sel.disabled = false;
        var allKel = DB.kelompok.filter(function(k) { return k.status === 'aktif'; });
        var tersedia = allKel.filter(function(k) {
          var cnt = DB.users.filter(function(u) { return +u.kelompok_id === +k.id && u.role === 'mahasiswa'; }).length;
          return cnt < +(k.max_anggota || 7);
        });
        var penuhList = allKel.filter(function(k) {
          var cnt = DB.users.filter(function(u) { return +u.kelompok_id === +k.id && u.role === 'mahasiswa'; }).length;
          return cnt >= +(k.max_anggota || 7);
        });
        var html = '<option value="">— Pilih kelompok Anda —</option>';
        if (tersedia.length > 0) {
          html += '<optgroup label="✅ Tersedia">' +
            tersedia.map(function(k) {
              return '<option value="' + k.id + '">' + k.nama + ' – ' + k.tema + '</option>';
            }).join('') + '</optgroup>';
        }
        if (penuhList.length > 0) {
          html += '<optgroup label="🔒 Penuh (tidak bisa dipilih)">' +
            penuhList.map(function(k) {
              return '<option value="' + k.id + '" disabled>' + k.nama + ' – ' + k.tema + ' (Penuh)</option>';
            }).join('') + '</optgroup>';
        }
        sel.innerHTML = html;
      });
    };
    window.showRegisterPage._smpmPatched = true;
  }

  // Patch showLoginPage agar sidebar/topbar benar-benar tersembunyi
  var origLogin = window.showLoginPage;
  if (origLogin && !origLogin._smpmPatched) {
    window.showLoginPage = function() {
      origLogin();
      smpmGoToLogin(); // pastikan sidebar tersembunyi
      smpmPatchForms();
    };
    window.showLoginPage._smpmPatched = true;
  }
}

/* ============================================================
   HELPER: tampilkan halaman login dengan bersih
   Pastikan sidebar/topbar tersembunyi dan tidak ada
   konten dashboard yang terlihat
   ============================================================ */
function smpmGoToLogin() {
  // Sembunyikan sidebar & topbar dulu
  var sidebar = document.getElementById('sidebar');
  var topbar  = document.getElementById('topbar');
  var mc      = document.getElementById('main-content');
  if (sidebar) { sidebar.classList.add('hidden'); sidebar.classList.remove('open'); }
  if (topbar)  topbar.classList.add('hidden');
  if (mc)      mc.style.marginLeft = '0';
  closeMobileSidebar();
  // Sembunyikan semua page
  ['login','dashboard','tugas','deadline','upload','kelompok','nilaiSaya',
   'tugasDosen','monitoring','penilaian','manageUser','manageKelompok','register'].forEach(function(p) {
    var el = document.getElementById('page-' + p);
    if (el) el.classList.add('hidden');
  });
  // Tampilkan halaman login
  var loginPage = document.getElementById('page-login');
  if (loginPage) loginPage.classList.remove('hidden');
  // Kosongkan & bersihkan form login
  var loginEmail = document.getElementById('login-email');
  var loginPass  = document.getElementById('login-pass');
  if (loginEmail) loginEmail.value = '';
  if (loginPass)  loginPass.value  = '';
  var errEl = document.getElementById('login-error');
  if (errEl) errEl.classList.add('hidden');
}

/* ============================================================
   INIT
   ============================================================ */
// Patch forms SEGERA saat script ini jalan
smpmPatchForms();

// Override showPage agar halaman admin selalu refresh data dari server
(function() {
  var origShowPage = window.showPage;
  if (!origShowPage) return;
  window.showPage = function(name) {
    // Untuk halaman yang butuh data fresh, load dulu baru render
    var needsRefresh = ['manageKelompok', 'manageUser', 'monitoring', 'penilaian', 'tugasDosen', 'dashboard'];
    if (needsRefresh.indexOf(name) !== -1 && currentUser) {
      origShowPage(name); // tampilkan halaman dulu (skeleton)
      smpmLoadDB().then(function() {
        // Re-render setelah data fresh
        if (typeof renderPage === 'function') renderPage(name);
      }).catch(function() {
        // Tetap render dengan data yang ada
        if (typeof renderPage === 'function') renderPage(name);
      });
    } else {
      origShowPage(name);
    }
  };
})();

(function smpmInit() {
  var loadingEl = document.createElement('div');
  loadingEl.id = 'smpm-loading';
  loadingEl.style.cssText = 'position:fixed;inset:0;background:var(--navy);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;gap:16px';
  loadingEl.innerHTML = '<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:smpm-spin 0.8s linear infinite"></div>'
    + '<div style="color:rgba(255,255,255,.7);font-size:.875rem">Memuat sistem...</div>';
  var style = document.createElement('style');
  style.textContent = '@keyframes smpm-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  document.body.appendChild(loadingEl);

  function hideLoading() {
    var el = document.getElementById('smpm-loading');
    if (el) el.remove();
  }

  function showRetry(msg) {
    var el = document.getElementById('smpm-loading');
    if (el) {
      el.innerHTML = '<div style="text-align:center;padding:24px;max-width:320px">'
        + '<div style="font-size:2rem;margin-bottom:12px">⚠️</div>'
        + '<div style="color:#fff;font-weight:600;margin-bottom:8px">Gagal terhubung ke server</div>'
        + '<div style="color:rgba(255,255,255,.6);font-size:.82rem;margin-bottom:20px">' + (msg || 'Periksa koneksi internet Anda.') + '</div>'
        + '<button onclick="window.location.reload()" style="background:#2F80ED;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:.9rem;cursor:pointer;font-weight:600">🔄 Coba Lagi</button>'
        + '</div>';
    }
  }

  smpmGet('check_session')
    .then(function(res) {
      hideLoading();
      if (res.ok && res.data) {
        currentUser = res.data;
        smpmLoadDB().then(function() {
          buildSidebar();
          showPage('dashboard');
          smpmPatchNavItems();
        });
      } else {
        smpmGoToLogin();
        smpmPatchRegisterPage();
      }
    })
    .catch(function(err) {
      var msg = (err && err.message) ? err.message : '';
      // Kalau error DB (bukan network), tampilkan pesan spesifik
      var isDbErr = msg.indexOf('database') !== -1 || msg.indexOf('SQLSTATE') !== -1 || msg.indexOf('PDO') !== -1;
      var isNet   = msg.indexOf('fetch') !== -1 || msg === '' || msg.indexOf('Failed') !== -1 || msg.indexOf('NetworkError') !== -1;
      if (isDbErr) {
        showRetry('Database sedang tidak tersedia. Coba beberapa saat lagi.');
      } else if (isNet) {
        showRetry('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        // Server mungkin tetap jalan, coba tampilkan halaman login
        hideLoading();
        smpmGoToLogin();
        smpmPatchRegisterPage();
        showToast('Server lambat merespons. Jika ada masalah, refresh halaman.', 'error');
      }
    });
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

  // Validasi kelompok tidak penuh (double-check di frontend)
  var kelData = DB.kelompok.find(function(k) { return +k.id === +kelompokId; });
  if (kelData) {
    var jmlAnggota = +(kelData.jumlah_anggota || 0) ||
      DB.users.filter(function(u) { return +u.kelompok_id === +kelompokId && u.role === 'mahasiswa'; }).length;
    if (jmlAnggota >= +(kelData.max_anggota || 7)) {
      return showErr('Kelompok ini sudah penuh! Pilih kelompok lain.');
    }
  }

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

      // Setelah daftar berhasil → kembali ke halaman login dengan pesan sukses
      // (tidak langsung masuk karena perlu admin verifikasi / login manual)
      smpmGoToLogin();
      smpmPatchForms();
      // Isi email saja, password dikosongkan — user ketik sendiri
      var loginEmail = document.getElementById('login-email');
      var loginPass  = document.getElementById('login-pass');
      if (loginEmail) loginEmail.value = email;
      if (loginPass)  loginPass.value  = '';
      showToast('✅ Akun berhasil dibuat! Silakan masuk dengan akun Anda.', 'success');
    })
    .catch(function(err) {
      if (btn) { btn.disabled = false; btn.textContent = 'Daftar Sekarang'; }
      showErr('Koneksi gagal. Periksa internet Anda, lalu coba lagi.');
    });
}

/* ============================================================
   ERROR HELPER
   ============================================================ */
function smpmHandleError(err, fallbackMsg) {
  var msg = (err && err.message) ? err.message : '';
  if (!msg || msg.indexOf('Failed to fetch') !== -1 || msg.indexOf('NetworkError') !== -1 || msg.indexOf('Load failed') !== -1) {
    showToast('Tidak dapat terhubung. Periksa koneksi internet Anda, lalu coba lagi.', 'error');
  } else if (msg.indexOf('AbortError') !== -1 || (err && err.name === 'AbortError')) {
    showToast('Request timeout. Koneksi lambat — coba lagi.', 'error');
  } else if (msg.indexOf('Server error') !== -1) {
    showToast('Server mengalami masalah. Coba refresh halaman.', 'error');
  } else {
    showToast(fallbackMsg || msg || 'Terjadi kesalahan. Coba lagi.', 'error');
  }
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
    })
    .catch(function(err) { if (btn) { btn.disabled = false; btn.textContent = 'Simpan User'; } smpmHandleError(err); });
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
  smpmPost('update_user', payload)
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
      if (!res.ok) { showToast(res.message || 'Gagal update user.', 'error'); return; }
      if (+userId === +currentUser.id) { currentUser = Object.assign({}, currentUser, res.data); buildSidebar(); }
      smpmLoadDB().then(function() { closeModal(); renderManageUser(); showToast('User berhasil diperbarui!', 'success'); });
    })
    .catch(function(err) { if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; } smpmHandleError(err); });
}

function deleteUser(id) {
  if (+id === +currentUser.id) { showToast('Tidak bisa hapus akun sendiri', 'error'); return; }
  smpmPost('delete_user', { id: id })
    .then(function(res) {
      if (!res.ok) { showToast(res.message || 'Gagal hapus user.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderManageUser(); showToast('User berhasil dihapus!', 'success'); });
    })
    .catch(function(err) { smpmHandleError(err); });
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
  smpmPost('add_kelompok', { nama: nama, tema: tema, dosen_id: dosenId, status: 'aktif' })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; }
      if (!res.ok) { showToast(res.message || 'Gagal tambah kelompok.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok "' + nama + '" berhasil ditambahkan!', 'success'); });
    })
    .catch(function(err) { if (btn) { btn.disabled = false; btn.textContent = 'Simpan'; } smpmHandleError(err); });
}

function updateKelompok(kelompokId) {
  var nama     = ((document.getElementById('ek-nama')     || {}).value || '').trim();
  var tema     = ((document.getElementById('ek-tema')     || {}).value || '').trim();
  var dosenId  = (document.getElementById('ek-dosen')     || {}).value || null;
  var progress = parseInt((document.getElementById('ek-progress') || {}).value) || 0;
  var status   = (document.getElementById('ek-status')    || {}).value || 'aktif';
  var maxAngg  = parseInt((document.getElementById('ek-maxanggota') || {}).value) || 7;
  if (!nama) { showToast('Nama kelompok wajib!', 'error'); return; }
  if (!tema) { showToast('Tema proyek wajib!', 'error'); return; }
  // Validasi: max tidak boleh kurang dari anggota saat ini
  var currentAnggota = DB.users.filter(function(u) { return +u.kelompok_id === +kelompokId && u.role === 'mahasiswa'; }).length;
  if (maxAngg < currentAnggota) {
    showToast('Batas anggota (' + maxAngg + ') lebih kecil dari anggota saat ini (' + currentAnggota + ')!', 'error'); return;
  }
  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }
  smpmPost('update_kelompok', { id: kelompokId, nama: nama, tema: tema, dosen_id: dosenId, progress: progress, status: status, max_anggota: maxAngg })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; }
      if (!res.ok) { showToast(res.message || 'Gagal update kelompok.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok berhasil diperbarui!', 'success'); });
    })
    .catch(function(err) { if (btn) { btn.disabled = false; btn.textContent = 'Simpan Perubahan'; } smpmHandleError(err); });
}

function konfirmasiHapusKelompok(kelompokId) {
  smpmPost('delete_kelompok', { id: kelompokId })
    .then(function(res) {
      if (!res.ok) { showToast(res.message || 'Gagal hapus kelompok.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderManageKelompok(); showToast('Kelompok berhasil dihapus!', 'success'); });
    })
    .catch(function(err) { smpmHandleError(err); });
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
  smpmPost('add_tugas', { judul: judul, kelompok_id: kelompokId, assignee_id: assignee, deadline: deadline, status: status, deskripsi: deskripsi })
    .then(function(res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas'; }
      if (!res.ok) { showToast(res.message || 'Gagal tambah tugas.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderTugasDosen(); showToast('Tugas "' + judul + '" berhasil ditambahkan!', 'success'); });
    })
    .catch(function(err) { if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas'; } smpmHandleError(err); });
}

function confirmHapusTugas(tugasId) {
  smpmPost('delete_tugas', { id: tugasId })
    .then(function(res) {
      if (!res.ok) { showToast(res.message || 'Gagal hapus tugas.', 'error'); return; }
      smpmLoadDB().then(function() { closeModal(); renderTugasDosen(); showToast('Tugas berhasil dihapus!', 'success'); });
    })
    .catch(function(err) { smpmHandleError(err); });
}

/* PENILAIAN */
function simpanNilai(kelompokId) {
  var nilaiEl    = document.getElementById('nilai-' + kelompokId);
  var feedbackEl = document.getElementById('feedback-' + kelompokId);
  var nilaiVal   = nilaiEl ? parseInt(nilaiEl.value) : null;
  var feedback   = feedbackEl ? feedbackEl.value.trim() : '';
  if (!nilaiEl || !nilaiEl.value) { showToast('Masukkan nilai terlebih dahulu!', 'error'); return; }
  if (isNaN(nilaiVal) || nilaiVal < 0 || nilaiVal > 100) { showToast('Nilai harus antara 0-100!', 'error'); return; }
  smpmPost('save_penilaian', { kelompok_id: kelompokId, nilai: nilaiVal, feedback: feedback })
    .then(function(res) {
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
    })
    .catch(function(err) { smpmHandleError(err); });
}

/* UPLOAD */
function submitKumpulkan(tugasId) {
  var inp     = document.getElementById('file-kumpulkan-' + tugasId);
  var catatan = ((document.getElementById('catatan-kumpulkan-' + tugasId) || {}).value || '').trim();
  if (!inp || !inp.files || !inp.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }

  var file = inp.files[0];
  var fd = new FormData();
  fd.append('action', 'upload_file');
  fd.append('tugas_id', tugasId);
  fd.append('file', file);
  if (catatan) fd.append('catatan', catatan);

  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }

  // Naikkan timeout jadi 60 detik untuk upload file (Railway bisa lambat)
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = controller ? setTimeout(function() { controller.abort(); }, 60000) : null;
  var fetchOpts = { method: 'POST', body: fd, credentials: 'include' };
  if (controller) fetchOpts.signal = controller.signal;

  fetch(_smpmBase + 'api.php?action=upload_file', fetchOpts)
    .then(function(r) {
      if (timer) clearTimeout(timer);
      // Pastikan respon adalah JSON bukan HTML error page
      var ct = r.headers.get('Content-Type') || '';
      if (ct.indexOf('application/json') === -1) {
        return r.text().then(function(txt) {
          throw new Error('Server error (' + r.status + '). ' + (txt.substring(0, 120) || ''));
        });
      }
      return r.json();
    })
    .then(function(json) {
      if (btn) { btn.disabled = false; btn.textContent = 'Kumpulkan Tugas'; }
      if (!json.ok) {
        showToast(json.message || 'Upload gagal.', 'error');
        return;
      }
      smpmLoadDB().then(function() {
        closeModal();
        renderTugas();
        showToast('Tugas berhasil dikumpulkan! File "' + file.name + '" diunggah.', 'success');
      });
    })
    .catch(function(err) {
      if (timer) clearTimeout(timer);
      if (btn) { btn.disabled = false; btn.textContent = 'Kumpulkan Tugas'; }
      var msg = (err && err.name === 'AbortError')
        ? 'Upload timeout. File mungkin terlalu besar atau koneksi lambat. Coba lagi.'
        : (err && err.message ? err.message : 'Koneksi gagal. Coba lagi.');
      showToast(msg, 'error');
    });
}

function handleUpload() {
  var tugasSel = document.getElementById('upload-tugas');
  var input    = document.getElementById('upload-input');
  if (!tugasSel || !tugasSel.value) { showToast('Pilih tugas terlebih dahulu!', 'error'); return; }
  if (!input || !input.files.length) { showToast('Pilih file terlebih dahulu!', 'error'); return; }

  var file = input.files[0];
  var fd = new FormData();
  fd.append('action', 'upload_file');
  fd.append('tugas_id', parseInt(tugasSel.value));
  fd.append('file', file);

  var btn = document.getElementById('btn-upload-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengupload...'; }

  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = controller ? setTimeout(function() { controller.abort(); }, 60000) : null;
  var fetchOpts = { method: 'POST', body: fd, credentials: 'include' };
  if (controller) fetchOpts.signal = controller.signal;

  fetch(_smpmBase + 'api.php?action=upload_file', fetchOpts)
    .then(function(r) {
      if (timer) clearTimeout(timer);
      var ct = r.headers.get('Content-Type') || '';
      if (ct.indexOf('application/json') === -1) {
        return r.text().then(function(txt) {
          throw new Error('Server error (' + r.status + '). ' + (txt.substring(0, 120) || ''));
        });
      }
      return r.json();
    })
    .then(function(json) {
      if (btn) { btn.disabled = false; btn.textContent = 'Upload'; }
      if (!json.ok) { showToast(json.message || 'Upload gagal.', 'error'); return; }
      smpmLoadDB().then(function() {
        input.value = '';
        tugasSel.value = '';
        renderUpload();
        showToast('File "' + file.name + '" berhasil diupload!', 'success');
      });
    })
    .catch(function(err) {
      if (timer) clearTimeout(timer);
      if (btn) { btn.disabled = false; btn.textContent = 'Upload'; }
      var msg = (err && err.name === 'AbortError')
        ? 'Upload timeout. Coba lagi atau gunakan file yang lebih kecil.'
        : (err && err.message ? err.message : 'Koneksi gagal. Coba lagi.');
      showToast(msg, 'error');
    });
}

function konfirmasiHapusUpload(uploadId) {
  smpmPost('delete_upload', { id: uploadId })
    .then(function(res) {
      if (!res.ok) { showToast(res.message || 'Gagal hapus.', 'error'); return; }
      // Hapus juga dari DB lokal agar UI responsif
      var idx = DB.uploads.findIndex(function(u) { return +u.id === +uploadId; });
      if (idx > -1) DB.uploads.splice(idx, 1);
      closeModal();
      renderUpload();
      showToast('File berhasil dihapus!', 'success');
      // Sync data fresh di background
      smpmLoadDB().then(function() { renderUpload(); });
    })
    .catch(function(err) { smpmHandleError(err); });
}

// Override hapusUpload dari app.js agar pakai loose comparison (+id)
// karena id dari server bisa string, dari JS bisa number
window.hapusUpload = function(uploadId) {
  var upload = DB.uploads.find(function(u) { return +u.id === +uploadId; });
  if (!upload) {
    showToast('File tidak ditemukan.', 'error');
    return;
  }
  var overlay = document.getElementById('modal-overlay');
  var body    = document.getElementById('modal-body');
  if (!overlay || !body) return;
  body.innerHTML =
    '<div class="modal-header">' +
      '<div class="modal-title">Konfirmasi Hapus File</div>' +
      '<button class="modal-close" onclick="closeModal()">&times;</button>' +
    '</div>' +
    '<div style="text-align:center;padding:20px 0">' +
      '<div style="width:64px;height:64px;background:var(--danger-lt);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">' +
        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
      '</div>' +
      '<p style="font-size:1rem;font-weight:600;margin-bottom:8px">Hapus File Ini?</p>' +
      '<p style="font-size:.875rem;color:var(--text-3);margin-bottom:16px">' + upload.nama_file + '</p>' +
    '</div>' +
    '<div style="display:flex;gap:10px">' +
      '<button class="btn btn-outline w-full" onclick="closeModal()" style="justify-content:center">Batal</button>' +
      '<button class="btn btn-danger w-full" onclick="konfirmasiHapusUpload(' + (+upload.id) + ')" style="justify-content:center">Ya, Hapus</button>' +
    '</div>';
  overlay.classList.remove('hidden');
};


/* ============================================================
   TUGAS KELOMPOK — override konsep tugas kelompok (bukan per-orang)
   - showTambahTugasModal: hapus dropdown assignee, tampil anggota otomatis
   - submitTambahTugas: kirim tanpa assignee_id (tugas milik seluruh kelompok)
   - renderTugas (mahasiswa): tampilkan semua tugas kelompok, bukan per-assignee
   - renderTugasDosen: kolom "Assignee" → "Anggota Kelompok"
   ============================================================ */

// Override showTambahTugasModal: tanpa dropdown assignee
window.showTambahTugasModal = function(kelompokId) {
  var kelompok = DB.kelompok.find(function(k) { return +k.id === +kelompokId; });
  var anggota  = DB.users.filter(function(u) { return +u.kelompok_id === +kelompokId && u.role === 'mahasiswa'; });
  var overlay  = document.getElementById('modal-overlay');
  var body     = document.getElementById('modal-body');
  if (!overlay || !body) return;

  var today = new Date().toISOString().split('T')[0];

  var anggotaHtml = anggota.length > 0
    ? anggota.map(function(a) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--surface);border-radius:var(--radius-md);border:1px solid var(--border)">' +
          '<div class="avatar" style="width:26px;height:26px;font-size:.65rem">' + a.avatar + '</div>' +
          '<span style="font-size:.85rem;font-weight:600">' + a.nama + '</span>' +
          '<span style="font-size:.75rem;color:var(--text-3)">(' + a.nim + ')</span>' +
        '</div>';
      }).join('')
    : '<div style="font-size:.82rem;color:var(--text-3);font-style:italic">Belum ada anggota di kelompok ini</div>';

  body.innerHTML =
    '<div class="modal-header">' +
      '<div class="modal-title">Tambah Tugas — ' + (kelompok ? kelompok.nama : '') + '</div>' +
      '<button class="modal-close" onclick="closeModal()">&times;</button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<div class="form-group">' +
        '<label class="form-label">Judul Tugas <span style="color:var(--danger)">*</span></label>' +
        '<input class="form-control" id="tt-judul" placeholder="Contoh: Buat ERD Database" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Ditugaskan ke Seluruh Anggota</label>' +
        '<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px">' + anggotaHtml + '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Deadline <span style="color:var(--danger)">*</span></label>' +
        '<input class="form-control" id="tt-deadline" type="date" min="' + today + '" value="' + today + '" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Status Awal</label>' +
        '<select class="form-control" id="tt-status">' +
          '<option value="pending">Pending</option>' +
          '<option value="proses">Proses</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Deskripsi / Catatan</label>' +
        '<textarea class="form-control" id="tt-desc" rows="3" placeholder="Instruksi tambahan untuk kelompok..." style="resize:vertical"></textarea>' +
      '</div>' +
      '<button class="btn btn-primary w-full" onclick="submitTambahTugas(' + kelompokId + ')" style="justify-content:center;padding:12px;margin-top:4px">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px"><path d="M12 5v14M5 12h14"/></svg>' +
        'Simpan Tugas untuk Kelompok' +
      '</button>' +
    '</div>';

  overlay.classList.remove('hidden');
};

// Override submitTambahTugas: kirim ke server tanpa assignee_id
window.submitTambahTugas = function(kelompokId) {
  var judul    = (document.getElementById('tt-judul')    || {}).value || '';
  judul = judul.trim();
  var deadline = (document.getElementById('tt-deadline') || {}).value || '';
  var status   = (document.getElementById('tt-status')   || {}).value || 'pending';
  var deskripsi= ((document.getElementById('tt-desc')    || {}).value || '').trim();

  if (!judul)    { showToast('Judul tugas wajib diisi!', 'error'); return; }
  if (!deadline) { showToast('Deadline wajib diisi!', 'error'); return; }

  var btn = document.querySelector('#modal-body .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

  smpmPost('add_tugas', {
    judul:       judul,
    kelompok_id: kelompokId,
    assignee_id: '',   // kosong = tugas kelompok, semua anggota
    deadline:    deadline,
    status:      status,
    deskripsi:   deskripsi
  }).then(function(res) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas untuk Kelompok'; }
    if (!res.ok) { showToast(res.message || 'Gagal tambah tugas.', 'error'); return; }
    smpmLoadDB().then(function() { closeModal(); renderTugasDosen(); showToast('Tugas berhasil ditambahkan untuk seluruh kelompok!', 'success'); });
  }).catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Simpan Tugas untuk Kelompok'; }
    smpmHandleError(err);
  });
};

// Override renderTugas untuk mahasiswa: tampilkan semua tugas kelompok (bukan per-assignee)
(function() {
  var _origRenderTugas = window.renderTugas;
  window.renderTugas = function() {
    if (!currentUser || currentUser.role !== 'mahasiswa') {
      if (_origRenderTugas) _origRenderTugas();
      return;
    }
    // Tampilkan SEMUA tugas kelompok, bukan filter per assignee
    var myTugas = DB.tugas.filter(function(t) { return +t.kelompok_id === +currentUser.kelompok_id; });
    var container = document.getElementById('tugas-list');
    if (!container) return;

    var html = '<div class="mb-16" style="display:flex;gap:12px;justify-content:flex-end">';
    html += '<button class="btn btn-primary" onclick="exportTugasAsPDF()" style="display:flex;align-items:center;gap:8px">';
    html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2zm-5 6H7m5 0v3m0-3H9m5-2v-2"/></svg>';
    html += 'Export PDF</button></div>';

    if (myTugas.length === 0) {
      html += '<div class="empty-state"><p>Belum ada tugas untuk kelompok ini</p></div>';
      container.innerHTML = html;
      return;
    }

    html += myTugas.map(function(t) {
      var myUploads = DB.uploads.filter(function(u) { return +u.tugas_id === +t.id; });
      return '<div class="card mb-8" style="border-left:4px solid ' + statusColor(t.status) + '">' +
        '<div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px">' +
          '<div style="flex:1;min-width:180px">' +
            '<div class="font-600">' + t.judul + '</div>' +
            '<div class="text-sm text-muted mt-4">Deadline: ' + formatDate(t.deadline) + '</div>' +
            (t.submitted_at ? '<div class="text-sm mt-4" style="color:var(--success)">&#x2713; Dikumpulkan: ' + formatDate(t.submitted_at) + '</div>' : '') +
          '</div>' +
          '<div class="flex gap-8 items-center" style="flex-wrap:wrap">' +
            statusBadge(t.status) +
            myUploads.map(function(u) {
              return '<span class="badge badge-navy" style="cursor:pointer;font-size:.72rem" onclick="lihatFileTugas(' + u.id + ')" title="Klik untuk lihat file"> ' + u.nama_file + '</span>';
            }).join('') +
            (t.status !== 'selesai'
              ? '<button class="btn btn-sm btn-success" onclick="showKumpulkanModal(' + t.id + ')" style="display:flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>Kumpulkan</button>'
              : '<button class="btn btn-sm btn-outline" onclick="showKumpulkanModal(' + t.id + ')" style="font-size:.75rem;display:flex;align-items:center;gap:5px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>Upload Lagi</button>') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;
  };
})();

// Override upload-tugas dropdown: tampilkan semua tugas kelompok (bukan per-assignee)
(function() {
  var _origRenderUpload = window.renderUpload;
  window.renderUpload = function() {
    // Patch dropdown tugas agar tampilkan semua tugas kelompok
    var origFn = _origRenderUpload || function(){};
    origFn();
    // Re-populate dropdown setelah render
    var tugasSelect = document.getElementById('upload-tugas');
    if (tugasSelect && currentUser && currentUser.role === 'mahasiswa') {
      var myTugas = DB.tugas.filter(function(t) {
        return +t.kelompok_id === +currentUser.kelompok_id && t.status !== 'selesai';
      });
      tugasSelect.innerHTML = '<option value="">-- Pilih Tugas yang Ingin Diupload --</option>' +
        myTugas.map(function(t) {
          return '<option value="' + t.id + '">' + t.judul + ' (Deadline: ' + formatDate(t.deadline) + ')</option>';
        }).join('');
    }
  };
})();

// Override renderTugasRows: kolom "Assignee" → tampilkan semua anggota kelompok
window.renderTugasRows = function(kelompokId) {
  var tugasList = DB.tugas.filter(function(t) { return +t.kelompok_id === +kelompokId; });
  if (tugasList.length === 0) return '<tr><td colspan="6" style="text-align:center;color:var(--text-3)">Belum ada tugas</td></tr>';

  var anggota = DB.users.filter(function(u) { return +u.kelompok_id === +kelompokId && u.role === 'mahasiswa'; });
  var anggotaHtml = anggota.length > 0
    ? anggota.map(function(a) {
        return '<div class="flex items-center gap-6" style="margin-bottom:3px">' +
          '<div class="avatar" style="width:20px;height:20px;font-size:.55rem">' + a.avatar + '</div>' +
          '<span class="text-sm">' + a.nama + '</span>' +
        '</div>';
      }).join('')
    : '<span class="text-muted text-sm">—</span>';

  return tugasList.map(function(t) {
    var tugasUploads = DB.uploads.filter(function(u) { return +u.tugas_id === +t.id; });
    var fileHtml = tugasUploads.length > 0
      ? tugasUploads.map(function(u) {
          return '<span class="badge badge-navy" style="font-size:.72rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px;margin-bottom:2px" onclick="lihatFileTugas(' + u.id + ')" title="Klik untuk buka file"> ' + u.nama_file + '</span>';
        }).join('<br>')
      : '<span class="text-muted text-sm" style="font-size:.78rem">Belum dikumpulkan</span>';

    return '<tr>' +
      '<td><span class="font-600">' + t.judul + '</span></td>' +
      '<td>' + anggotaHtml + '</td>' +
      '<td class="text-sm text-muted">' + formatDate(t.deadline) + '</td>' +
      '<td>' + statusBadge(t.status) + '</td>' +
      '<td>' + fileHtml + (t.submitted_at ? '<div style="font-size:.68rem;color:var(--text-3);margin-top:2px"> ' + formatDate(t.submitted_at) + '</div>' : '') + '</td>' +
      '<td>' +
        '<div class="flex gap-6">' +
          '<button class="btn btn-sm btn-outline" onclick="showEditTugasModal(' + t.id + ')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="hapusTugas(' + t.id + ', ' + kelompokId + ')">Hapus</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
};

/* ============================================================
   KAPASITAS KELOMPOK — tampilkan X/7 di dashboard & monitoring
   ============================================================ */

// Helper: hitung anggota kelompok
function smpmAnggotaCount(kelompokId) {
  return DB.users.filter(function(u) { return +u.kelompok_id === +kelompokId && u.role === 'mahasiswa'; }).length;
}

// Override renderDashboard agar tampil info anggota X/7
(function() {
  var _orig = window.renderDashboard;
  window.renderDashboard = function() {
    if (_orig) _orig();

    // Patch tabel kelompok di dashboard dosen & admin — tambah kolom anggota
    setTimeout(function() {
      // Cari semua tabel yang punya header "Kelompok" dan "Progress"
      document.querySelectorAll('.data-table').forEach(function(tbl) {
        var headers = tbl.querySelectorAll('thead th');
        var hasKelompok = false, hasProgress = false, hasAnggota = false;
        headers.forEach(function(th) {
          if (th.textContent.trim() === 'Kelompok') hasKelompok = true;
          if (th.textContent.trim() === 'Progress')  hasProgress = true;
          if (th.textContent.trim() === 'Anggota')   hasAnggota = true;
        });
        if (hasKelompok && hasProgress && !hasAnggota) {
          // Tambah header "Anggota" setelah "Progress"
          headers.forEach(function(th, i) {
            if (th.textContent.trim() === 'Progress') {
              var newTh = document.createElement('th');
              newTh.textContent = 'Anggota';
              th.parentNode.insertBefore(newTh, th.nextSibling);
            }
          });
          // Tambah cell di setiap baris
          tbl.querySelectorAll('tbody tr').forEach(function(tr) {
            var cells = tr.querySelectorAll('td');
            // Cari index kolom progress (biasanya ke-3, index 2)
            var insertAfter = null;
            cells.forEach(function(td, i) {
              if (td.querySelector('.progress-wrap')) insertAfter = td;
            });
            if (insertAfter) {
              // Cari kelompok dari nama di kolom pertama
              var namaKel = (tr.querySelector('td strong') || tr.querySelector('td')).textContent.trim();
              var kel = DB.kelompok.find(function(k) { return k.nama === namaKel; });
              var cnt = kel ? smpmAnggotaCount(kel.id) : 0;
              var max = kel ? (kel.max_anggota || 7) : 7;
              var penuh = cnt >= max;
              var td = document.createElement('td');
              td.innerHTML = '<span style="font-size:.82rem;font-weight:700;color:' +
                (penuh ? 'var(--success)' : 'var(--accent)') + '">' + cnt + '/' + max + '</span>' +
                (penuh ? '<span class="badge badge-green" style="font-size:.65rem;margin-left:4px">Penuh</span>' : '');
              insertAfter.parentNode.insertBefore(td, insertAfter.nextSibling);
            }
          });
        }
      });
    }, 100);
  };
})();

/* ============================================================
   DASHBOARD DOSEN — hanya tampilkan kelompok bimbingan sendiri
   ============================================================ */
(function() {
  var _origRenderDashboard = window.renderDashboard;
  window.renderDashboard = function() {
    if (!currentUser || currentUser.role !== 'dosen') {
      if (_origRenderDashboard) _origRenderDashboard();
      return;
    }

    // Filter hanya kelompok yang dibimbing dosen ini
    var myKelompok = DB.kelompok.filter(function(k) {
      return +k.dosen_id === +currentUser.id;
    });

    var onTrack  = myKelompok.filter(function(k) { return k.progress >= 50; }).length;
    var perhatian = myKelompok.filter(function(k) { return k.progress < 50; }).length;

    // Hitung total mahasiswa dari kelompok bimbingan
    var myKelIds = myKelompok.map(function(k) { return +k.id; });
    var totalMhs = DB.users.filter(function(u) {
      return u.role === 'mahasiswa' && myKelIds.indexOf(+u.kelompok_id) !== -1;
    }).length;
    var totalUpload = DB.uploads.filter(function(u) {
      return myKelIds.indexOf(+u.kelompok_id) !== -1;
    }).length;

    document.getElementById('dash-welcome').textContent =
      'Halo, ' + currentUser.nama.split(' ')[0] + '! Anda membimbing ' + myKelompok.length + ' kelompok.';

    document.getElementById('dash-stats').innerHTML =
      '<div class="stat-card"><div class="stat-label">Kelompok Bimbingan</div><div class="stat-value">' + myKelompok.length + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">On Track</div><div class="stat-value" style="color:var(--success)">' + onTrack + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Perlu Perhatian</div><div class="stat-value" style="color:var(--danger)">' + perhatian + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Total Mahasiswa</div><div class="stat-value">' + totalMhs + '</div></div>';

    document.getElementById('dash-progress').innerHTML = '';

    if (myKelompok.length === 0) {
      document.getElementById('dash-recent').innerHTML =
        '<div class="card mt-16"><div class="empty-state"><p>Anda belum membimbing kelompok manapun.</p></div></div>';
      return;
    }

    var rows = myKelompok.map(function(k) {
      var anggota = DB.users.filter(function(u) {
        return u.role === 'mahasiswa' && +u.kelompok_id === +k.id;
      });
      var maxAnggota = k.max_anggota || 7;
      var tugasKelompok = DB.tugas.filter(function(t) { return +t.kelompok_id === +k.id; });
      var selesai = tugasKelompok.filter(function(t) { return t.status === 'selesai'; }).length;

      var anggotaHtml = anggota.length > 0
        ? anggota.map(function(a) {
            return '<div class="flex items-center gap-6" style="margin-bottom:2px">' +
              '<div class="avatar" style="width:20px;height:20px;font-size:.55rem">' + a.avatar + '</div>' +
              '<span class="text-sm">' + a.nama + '</span>' +
            '</div>';
          }).join('')
        : '<span class="text-muted text-sm">Belum ada anggota</span>';

      return '<tr>' +
        '<td>' +
          '<strong>' + k.nama + '</strong>' +
          '<div class="text-xs text-muted mt-4" style="max-width:200px">' + k.tema + '</div>' +
        '</td>' +
        '<td>' + anggotaHtml + '</td>' +
        '<td style="text-align:center">' +
          '<span style="font-weight:700;color:' + (anggota.length >= maxAnggota ? 'var(--success)' : 'var(--accent)') + '">' +
            anggota.length + '/' + maxAnggota +
          '</span>' +
        '</td>' +
        '<td style="text-align:center;font-weight:700">' +
          selesai + '/' + tugasKelompok.length +
        '</td>' +
        '<td style="min-width:140px">' +
          '<div class="flex items-center gap-8">' +
            '<div class="progress-wrap" style="flex:1"><div class="progress-fill ' + progressColor(k.progress) + '" style="width:' + k.progress + '%"></div></div>' +
            '<span class="text-sm font-600">' + k.progress + '%</span>' +
          '</div>' +
        '</td>' +
        '<td>' + progressBadge(k.progress) + '</td>' +
      '</tr>';
    }).join('');

    document.getElementById('dash-recent').innerHTML =
      '<div class="card mt-16">' +
        '<div class="flex justify-between items-center mb-16" style="flex-wrap:wrap;gap:8px">' +
          '<div class="card-title" style="margin:0">Kelompok Bimbingan Saya</div>' +
          '<button class="btn btn-primary btn-sm" onclick="showPage(\'tugasDosen\')" style="display:flex;align-items:center;gap:6px;font-size:.82rem">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>' +
            'Tambah Tugas' +
          '</button>' +
        '</div>' +
        '<div class="table-wrap">' +
          '<table class="data-table">' +
            '<thead><tr>' +
              '<th>Kelompok & Tema</th>' +
              '<th>Anggota</th>' +
              '<th style="text-align:center">Jumlah</th>' +
              '<th style="text-align:center">Tugas Selesai</th>' +
              '<th>Progress</th>' +
              '<th>Status</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
  };
})();

/* Override renderTugasDosen: hanya tampilkan kelompok bimbingan dosen ini */
(function() {
  var _origRender = window.renderTugasDosen;
  window.renderTugasDosen = function() {
    if (!currentUser || currentUser.role !== 'dosen') {
      if (_origRender) _origRender();
      return;
    }
    // Filter kelompok hanya milik dosen ini
    var myKelompok = DB.kelompok.filter(function(k) {
      return +k.dosen_id === +currentUser.id;
    });

    var container = document.getElementById('tugasDosen-list');
    if (!container) { if (_origRender) _origRender(); return; }

    if (myKelompok.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Anda belum membimbing kelompok manapun.</p></div>';
      return;
    }

    // Patch DB.kelompok sementara agar renderTugasDosen asli hanya lihat kelompok milik dosen ini
    var origKelompok = DB.kelompok.slice();
    DB.kelompok.length = 0;
    myKelompok.forEach(function(k) { DB.kelompok.push(k); });
    if (_origRender) _origRender();
    // Restore
    DB.kelompok.length = 0;
    origKelompok.forEach(function(k) { DB.kelompok.push(k); });
  };
})();

/* Override renderMonitoring: hanya tampilkan kelompok bimbingan dosen ini */
(function() {
  var _origRender = window.renderMonitoring;
  window.renderMonitoring = function() {
    if (!currentUser || currentUser.role !== 'dosen') {
      if (_origRender) _origRender();
      return;
    }
    var myKelompok = DB.kelompok.filter(function(k) {
      return +k.dosen_id === +currentUser.id;
    });
    var origKelompok = DB.kelompok.slice();
    DB.kelompok.length = 0;
    myKelompok.forEach(function(k) { DB.kelompok.push(k); });
    if (_origRender) _origRender();
    DB.kelompok.length = 0;
    origKelompok.forEach(function(k) { DB.kelompok.push(k); });
  };
})();

/* Override renderPenilaian: hanya tampilkan kelompok bimbingan dosen ini */
(function() {
  var _origRender = window.renderPenilaian;
  window.renderPenilaian = function() {
    if (!currentUser || currentUser.role !== 'dosen') {
      if (_origRender) _origRender();
      return;
    }
    var myKelompok = DB.kelompok.filter(function(k) {
      return +k.dosen_id === +currentUser.id;
    });
    var origKelompok = DB.kelompok.slice();
    DB.kelompok.length = 0;
    myKelompok.forEach(function(k) { DB.kelompok.push(k); });
    if (_origRender) _origRender();
    DB.kelompok.length = 0;
    origKelompok.forEach(function(k) { DB.kelompok.push(k); });
  };
})();
