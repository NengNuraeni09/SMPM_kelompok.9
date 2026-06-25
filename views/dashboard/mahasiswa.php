<?php
/* =============================================
   SMPM — View: Dashboard Mahasiswa
   ============================================= */
$pageTitle = 'Dashboard';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">

    <div class="page-header">
      <h1>Selamat Datang, <?= htmlspecialchars($data['user']['nama']) ?> 👋</h1>
      <p>Ringkasan aktivitas proyek Anda. Completion rate: <strong><?= $data['completion'] ?>%</strong></p>
    </div>

    <!-- Stats -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Tugas</div>
        <div class="stat-value"><?= $data['total'] ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Selesai</div>
        <div class="stat-value" style="color:var(--success)"><?= $data['selesai'] ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sedang Proses</div>
        <div class="stat-value" style="color:var(--accent)"><?= $data['proses'] ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Terlambat</div>
        <div class="stat-value" style="color:var(--danger)"><?= $data['terlambat'] ?></div>
      </div>
    </div>

    <!-- Progress kelompok -->
    <?php if ($data['kelompok']): $k = $data['kelompok']; ?>
    <div class="card mt-16">
      <div class="card-title">Progress <?= htmlspecialchars($k['nama']) ?></div>
      <div class="flex items-center gap-16 mb-8">
        <div style="flex:1">
          <div class="text-sm text-muted mb-4"><?= htmlspecialchars($k['tema']) ?></div>
        </div>
        <span style="font-family:var(--font-display);font-size:1.4rem;font-weight:800;color:var(--accent)">
          <?= $k['progress'] ?>%
        </span>
      </div>
      <div class="progress-wrap">
        <div class="progress-fill progress-blue" style="width:<?= $k['progress'] ?>%"></div>
      </div>
    </div>
    <?php endif; ?>

    <!-- Tugas terbaru -->
    <div class="card mt-16">
      <div class="flex justify-between items-center mb-16">
        <div class="card-title" style="margin:0">Tugas Terbaru</div>
        <a href="index.php?page=tugas" class="btn btn-outline btn-sm">Lihat Semua →</a>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Judul Tugas</th><th>Deadline</th><th>Status</th></tr>
          </thead>
          <tbody>
            <?php foreach (array_slice($data['tugasList'], 0, 5) as $t): ?>
            <tr>
              <td><?= htmlspecialchars($t['judul']) ?></td>
              <td class="text-sm"><?= date('d M Y', strtotime($t['deadline'])) ?></td>
              <td>
                <?php
                $sc = match($t['status']) {
                    'selesai'   => 'badge-green',
                    'proses'    => 'badge-blue',
                    'terlambat' => 'badge-red',
                    default     => 'badge-amber',
                };
                ?>
                <span class="badge <?= $sc ?>"><?= ucfirst($t['status']) ?></span>
              </td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nilai -->
    <?php if ($data['penilaian']): $n = $data['penilaian']; ?>
    <div class="card mt-16">
      <div class="card-title">📊 Nilai dari Dosen</div>
      <div class="flex items-center gap-24">
        <div style="text-align:center">
          <div style="font-family:var(--font-display);font-size:2.5rem;font-weight:800;color:var(--accent)">
            <?= $n['nilai'] ?? '—' ?>
          </div>
          <div class="text-sm text-muted">Nilai</div>
        </div>
        <?php if ($n['feedback']): ?>
        <div style="flex:1;background:var(--surface);border-radius:var(--radius-md);padding:14px;
                    border-left:3px solid var(--accent);font-size:.88rem;color:var(--text-2)">
          <?= htmlspecialchars($n['feedback']) ?>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>

  </div>
</div>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
