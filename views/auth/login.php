<?php
/* =============================================
   SMPM — View: Login
   Tombol demo: hanya Admin yang bisa diklik
   ============================================= */
$pageTitle = 'Login';
require_once __DIR__ . '/../layout/header.php';
?>

<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
            background:var(--navy);padding:20px">
  <div style="width:100%;max-width:420px">

    <!-- Brand -->
    <div style="text-align:center;margin-bottom:32px">
      <div style="width:64px;height:64px;background:rgba(255,255,255,.1);border-radius:16px;
                  display:flex;align-items:center;justify-content:center;margin:0 auto 16px;
                  border:1px solid rgba(255,255,255,.15)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      </div>
      <h1 style="font-family:var(--font-display);color:#fff;font-size:1.8rem;font-weight:800;letter-spacing:-.02em">SMPM</h1>
      <p style="color:rgba(255,255,255,.5);font-size:.875rem;margin-top:4px">Sistem Manajemen Proyek Mahasiswa</p>
    </div>

    <!-- Card Form -->
    <div style="background:var(--white);border-radius:var(--radius-xl);padding:32px">
      <h2 style="font-family:var(--font-display);font-size:1.15rem;font-weight:700;margin-bottom:20px">
        Masuk ke Akun Anda
      </h2>

      <!-- Error message -->
      <?php if (!empty($error)): ?>
      <div style="background:var(--danger-lt);color:var(--danger);padding:10px 14px;
                  border-radius:var(--radius-md);font-size:.85rem;margin-bottom:16px;
                  border:1px solid #FCA5A5">
        ✕ <?= htmlspecialchars($error) ?>
      </div>
      <?php endif; ?>

      <!-- Login Form -->
      <form method="POST" action="index.php?action=login">
        <div class="form-group mb-16">
          <label class="form-label">Email Akun</label>
          <input name="email" id="login-email" class="form-control" type="email"
                 placeholder="email@kampus.ac.id"
                 value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                 required autocomplete="email" />
        </div>
        <div class="form-group mb-20">
          <label class="form-label">Password</label>
          <input name="password" id="login-pass" class="form-control" type="password"
                 placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <button type="submit" class="btn btn-primary w-full"
                style="justify-content:center;padding:12px">
          Masuk
        </button>
      </form>

      <!-- Demo Akun -->
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
        <p style="font-size:.75rem;color:var(--text-3);text-align:center;margin-bottom:10px">
          Demo akun tersedia:
        </p>

        <div style="display:flex;flex-direction:column;gap:6px">

          <!-- Admin — BISA diklik -->
          <div onclick="fillLogin('admin@kampus.ac.id','admin')"
               style="display:flex;justify-content:space-between;align-items:center;
                      padding:8px 12px;border-radius:var(--radius-md);background:var(--surface);
                      cursor:pointer;transition:background .15s;border:1px solid var(--border)"
               onmouseover="this.style.background='var(--border)'"
               onmouseout="this.style.background='var(--surface)'"
               title="Klik untuk isi otomatis akun Admin">
            <div>
              <span style="font-size:.78rem;font-weight:600">Admin</span>
              <span style="font-size:.75rem;color:var(--text-3);margin-left:6px">admin@kampus.ac.id</span>
            </div>
            <span class="badge badge-red" style="font-size:.68rem">
              Klik untuk isi
            </span>
          </div>

        </div>
      </div>
    </div><!-- /card -->

    <p style="text-align:center;color:rgba(255,255,255,.3);font-size:.75rem;margin-top:20px">
      Kelompok 09 · Studi Kasus Pemrograman Web
    </p>
  </div>
</div>

<script>
function fillLogin(email, pass) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-pass').value  = pass;
}
</script>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
