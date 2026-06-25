<?php
$pageTitle = 'Kelola Kelompok';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">
    <div class="page-header">
      <h1>Kelola Kelompok</h1>
      <p>Atur pembagian kelompok dan penugasan dosen pembimbing.</p>
    </div>

    <!-- Form tambah kelompok -->
    <div class="card mb-16">
      <div class="card-title">Tambah Kelompok Baru</div>
      <form method="POST" action="index.php?action=storeKelompok">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:14px">
          <div class="form-group">
            <label class="form-label">Nama Kelompok *</label>
            <input name="nama" class="form-control" type="text" placeholder="Kelompok 01" required />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Tema Proyek *</label>
            <input name="tema" class="form-control" type="text" placeholder="Tema / judul proyek" required />
          </div>
          <div class="form-group">
            <label class="form-label">Dosen Pembimbing</label>
            <select name="dosen_id" class="form-control">
              <option value="">— Pilih Dosen —</option>
              <?php foreach ($dosenList as $d): ?>
              <option value="<?= $d['id'] ?>"><?= htmlspecialchars($d['nama']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-control">
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">+ Tambah Kelompok</button>
      </form>
    </div>

    <!-- Tabel kelompok -->
    <div class="card">
      <div class="card-title">Daftar Kelompok (<?= count($kelompokList) ?>)</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Kelompok</th><th>Tema</th><th>Dosen</th><th>Progress</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            <?php foreach ($kelompokList as $k): ?>
            <tr>
              <td><strong><?= htmlspecialchars($k['nama']) ?></strong></td>
              <td class="text-sm text-muted"><?= htmlspecialchars($k['tema']) ?></td>
              <td class="text-sm"><?= htmlspecialchars($k['dosen_nama'] ?? '—') ?></td>
              <td style="min-width:120px">
                <div class="flex items-center gap-8">
                  <div class="progress-wrap" style="flex:1">
                    <div class="progress-fill progress-blue" style="width:<?= $k['progress'] ?>%"></div>
                  </div>
                  <span class="text-sm font-600"><?= $k['progress'] ?>%</span>
                </div>
              </td>
              <td>
                <span class="badge <?= $k['status'] === 'aktif' ? 'badge-green' : 'badge-navy' ?>">
                  <?= ucfirst($k['status']) ?>
                </span>
              </td>
              <td>
                <form method="POST" action="index.php?action=deleteKelompok"
                      onsubmit="return confirm('Hapus <?= htmlspecialchars(addslashes($k['nama'])) ?>?')">
                  <input type="hidden" name="id" value="<?= $k['id'] ?>" />
                  <button type="submit" class="btn btn-danger btn-sm">Hapus</button>
                </form>
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
