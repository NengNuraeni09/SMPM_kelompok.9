<?php
$pageTitle = 'Kelola Pengguna';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">
    <div class="page-header">
      <h1>Kelola Pengguna</h1>
      <p>Tambah, edit, dan hapus akun pengguna sistem.</p>
    </div>

    <!-- Form tambah user -->
    <div class="card mb-16">
      <div class="card-title">Tambah User Baru</div>
      <form method="POST" action="index.php?action=storeUser">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:14px">
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <input name="nama" class="form-control" type="text" placeholder="Nama lengkap" required />
          </div>
          <div class="form-group">
            <label class="form-label">NIM / ID *</label>
            <input name="nim" class="form-control" type="text" placeholder="2021001" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input name="email" class="form-control" type="email" placeholder="email@kampus.ac.id" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <input name="password" class="form-control" type="password" placeholder="Min. 6 karakter" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">Role *</label>
            <select name="role" class="form-control" required>
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kelompok</label>
            <select name="kelompok_id" class="form-control">
              <option value="">— Tidak ada —</option>
              <?php foreach ($kelompokList as $k): ?>
              <option value="<?= $k['id'] ?>"><?= htmlspecialchars($k['nama']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">+ Tambah User</button>
      </form>
    </div>

    <!-- Tabel user -->
    <div class="card">
      <div class="card-title">Daftar Pengguna (<?= count($users) ?>)</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Nama</th><th>NIM</th><th>Email</th><th>Role</th><th>Kelompok</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            <?php foreach ($users as $u): ?>
            <tr>
              <td>
                <div class="flex items-center gap-8">
                  <div class="avatar" style="width:28px;height:28px;font-size:.7rem">
                    <?= htmlspecialchars($u['avatar'] ?? '--') ?>
                  </div>
                  <?= htmlspecialchars($u['nama']) ?>
                </div>
              </td>
              <td class="text-sm"><?= htmlspecialchars($u['nim']) ?></td>
              <td class="text-sm text-muted"><?= htmlspecialchars($u['email']) ?></td>
              <td>
                <?php $bc = match($u['role']) { 'admin' => 'badge-red', 'dosen' => 'badge-amber', default => 'badge-blue' }; ?>
                <span class="badge <?= $bc ?>"><?= ucfirst($u['role']) ?></span>
              </td>
              <td class="text-sm">
                <?php
                $kp = array_filter($kelompokList, fn($k) => $k['id'] === $u['kelompok_id']);
                echo $kp ? htmlspecialchars(array_values($kp)[0]['nama']) : '—';
                ?>
              </td>
              <td>
                <?php if ((int)$u['id'] !== (int)$_SESSION['user']['id']): ?>
                <form method="POST" action="index.php?action=deleteUser"
                      onsubmit="return confirm('Hapus user <?= htmlspecialchars(addslashes($u['nama'])) ?>?')">
                  <input type="hidden" name="id" value="<?= $u['id'] ?>" />
                  <button type="submit" class="btn btn-danger btn-sm">Hapus</button>
                </form>
                <?php else: ?>
                <span class="text-muted text-sm">Anda sendiri</span>
                <?php endif; ?>
              </td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</div>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
