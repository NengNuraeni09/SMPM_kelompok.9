<?php
$pageTitle = 'Tugas Kelompok';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">
    <div class="page-header">
      <h1>Tugas Kelompok</h1>
      <p>Kelola dan tambahkan tugas untuk mahasiswa bimbingan Anda.</p>
    </div>

    <!-- Form tambah tugas -->
    <div class="card mb-16">
      <div class="card-title">Tambah Tugas Baru</div>
      <form method="POST" action="index.php?action=storeTugas">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:14px">
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Judul Tugas *</label>
            <input name="judul" class="form-control" type="text"
                   placeholder="Judul tugas yang jelas" required />
          </div>
          <div class="form-group">
            <label class="form-label">Kelompok *</label>
            <select name="kelompok_id" class="form-control" required>
              <option value="">— Pilih Kelompok —</option>
              <?php foreach ($kelompokList as $k): ?>
              <option value="<?= $k['id'] ?>"><?= htmlspecialchars($k['nama']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline *</label>
            <input name="deadline" class="form-control" type="date" required
                   min="<?= date('Y-m-d') ?>" />
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Deskripsi (opsional)</label>
            <textarea name="deskripsi" class="form-control" rows="2"
                      placeholder="Penjelasan detail tugas..."></textarea>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">+ Tambah Tugas</button>
      </form>
    </div>

    <!-- Daftar tugas -->
    <div class="card">
      <div class="card-title">Semua Tugas (<?= count($tugasList) ?>)</div>
      <?php if (empty($tugasList)): ?>
      <div class="empty-state">
        <p>Belum ada tugas yang ditambahkan.</p>
      </div>
      <?php else: ?>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Judul</th><th>Kelompok</th><th>Deadline</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            <?php foreach ($tugasList as $t): ?>
            <tr>
              <td><?= htmlspecialchars($t['judul']) ?></td>
              <td class="text-sm"><?= htmlspecialchars($t['kelompok_nama'] ?? '—') ?></td>
              <td class="text-sm"><?= date('d M Y', strtotime($t['deadline'])) ?></td>
              <td>
                <?php $bc = match($t['status']) {
                    'selesai'   => 'badge-green',
                    'proses'    => 'badge-blue',
                    'terlambat' => 'badge-red',
                    default     => 'badge-amber',
                }; ?>
                <span class="badge <?= $bc ?>"><?= ucfirst($t['status']) ?></span>
              </td>
              <td>
                <form method="POST" action="index.php?action=deleteTugas"
                      onsubmit="return confirm('Hapus tugas ini?')">
                  <input type="hidden" name="id" value="<?= $t['id'] ?>" />
                  <button type="submit" class="btn btn-danger btn-sm">Hapus</button>
                </form>
              </td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
      <?php endif; ?>
    </div>

  </div>
</div>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
