<?php
/* =============================================
   SMPM — View: Dashboard Dosen
   ============================================= */
$pageTitle = 'Dashboard';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">

    <div class="page-header">
      <h1>Selamat Datang, <?= htmlspecialchars($data['user']['nama']) ?> 👋</h1>
      <p>Pantau perkembangan semua kelompok bimbingan Anda.</p>
    </div>

    <!-- Stats -->
    <?php
    $onTrack   = count(array_filter($data['kelompokList'], fn($k) => $k['progress'] >= 50));
    $perhatian = count($data['kelompokList']) - $onTrack;
    ?>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total Kelompok</div>
        <div class="stat-value"><?= count($data['kelompokList']) ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">On Track</div>
        <div class="stat-value" style="color:var(--success)"><?= $onTrack ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Perlu Perhatian</div>
        <div class="stat-value" style="color:var(--danger)"><?= $perhatian ?></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Upload</div>
        <div class="stat-value"><?= count($data['uploads']) ?></div>
      </div>
    </div>

    <!-- Semua kelompok -->
    <div class="card mt-16">
      <div class="flex justify-between items-center mb-16" style="flex-wrap:wrap;gap:8px">
        <div class="card-title" style="margin:0">Status Semua Kelompok</div>
        <a href="index.php?page=tugasDosen" class="btn btn-primary btn-sm">
          + Tambah Tugas
        </a>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Kelompok</th><th>Tema Proyek</th><th>Progress</th><th>Status</th></tr>
          </thead>
          <tbody>
            <?php foreach ($data['kelompokList'] as $k): ?>
            <tr>
              <td><strong><?= htmlspecialchars($k['nama']) ?></strong></td>
              <td class="text-muted text-sm"><?= htmlspecialchars($k['tema']) ?></td>
              <td style="min-width:160px">
                <div class="flex items-center gap-8">
                  <div class="progress-wrap" style="flex:1">
                    <div class="progress-fill <?= $k['progress'] >= 70 ? 'progress-green' : ($k['progress'] >= 40 ? 'progress-blue' : 'progress-amber') ?>"
                         style="width:<?= $k['progress'] ?>%"></div>
                  </div>
                  <span class="text-sm font-600"><?= $k['progress'] ?>%</span>
                </div>
              </td>
              <td>
                <?php $isOk = $k['progress'] >= 50; ?>
                <span class="badge <?= $isOk ? 'badge-green' : 'badge-red' ?>">
                  <?= $isOk ? 'On Track' : 'Perlu Perhatian' ?>
                </span>
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
