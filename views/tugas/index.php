<?php
$pageTitle = 'Tugas Saya';
require_once __DIR__ . '/../layout/header.php';
require_once __DIR__ . '/../layout/sidebar.php';
?>

<div class="main-content">
  <div class="page-body">
    <div class="page-header">
      <h1>Tugas Saya</h1>
      <p>Semua tugas yang ditugaskan kepada Anda dalam kelompok.</p>
    </div>

    <?php if (empty($tugasList)): ?>
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
      </svg>
      <p>Belum ada tugas.</p>
    </div>
    <?php else: ?>

    <?php
    $statusColor = fn($s) => match($s) {
        'selesai'   => 'var(--success)',
        'proses'    => 'var(--accent)',
        'terlambat' => 'var(--danger)',
        default     => 'var(--warning)',
    };
    $statusBadge = fn($s) => match($s) {
        'selesai'   => '<span class="badge badge-green">Selesai</span>',
        'proses'    => '<span class="badge badge-blue">Proses</span>',
        'terlambat' => '<span class="badge badge-red">Terlambat</span>',
        default     => '<span class="badge badge-amber">Pending</span>',
    };
    ?>

    <?php foreach ($tugasList as $t): ?>
    <div class="card mb-8" style="border-left:4px solid <?= $statusColor($t['status']) ?>">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:10px">
        <div style="flex:1;min-width:200px">
          <div class="font-600"><?= htmlspecialchars($t['judul']) ?></div>
          <div class="text-sm text-muted mt-4">
            Deadline: <?= date('d M Y', strtotime($t['deadline'])) ?>
          </div>
          <?php if (!empty($t['deskripsi'])): ?>
          <div class="text-sm text-muted mt-4"><?= htmlspecialchars($t['deskripsi']) ?></div>
          <?php endif; ?>
        </div>
        <div class="flex gap-8 items-center" style="flex-wrap:wrap">
          <?= $statusBadge($t['status']) ?>
          <?php if ($t['status'] !== 'selesai'): ?>
          <form method="POST" action="index.php?action=uploadTugas"
                enctype="multipart/form-data" style="display:flex;align-items:center;gap:6px">
            <input type="hidden" name="tugas_id" value="<?= $t['id'] ?>" />
            <input type="file" name="file" required
                   accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                   style="font-size:.78rem;max-width:180px" />
            <button type="submit" class="btn btn-success btn-sm"
                    style="display:flex;align-items:center;gap:5px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Kumpulkan
            </button>
          </form>
          <?php else: ?>
          <span class="badge badge-green">✓ Sudah dikumpulkan</span>
          <?php endif; ?>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
    <?php endif; ?>

  </div>
</div>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
