<?php
$user = $_SESSION['user'] ?? null;
if (!$user) return;
$role = $user['role'];

$menus = [
    'mahasiswa' => [
        ['icon' => 'dashboard', 'label' => 'Dashboard',   'page' => 'dashboard'],
        ['icon' => 'clipboard', 'label' => 'Tugas Saya',  'page' => 'tugas'],
        ['icon' => 'calendar',  'label' => 'Deadline',    'page' => 'deadline'],
        ['icon' => 'upload',    'label' => 'Upload File', 'page' => 'upload'],
        ['icon' => 'users',     'label' => 'Kelompok',    'page' => 'kelompok'],
        ['icon' => 'award',     'label' => 'Nilai Saya',  'page' => 'nilai'],
    ],
    'dosen' => [
        ['icon' => 'dashboard', 'label' => 'Dashboard',   'page' => 'dashboard'],
        ['icon' => 'clipboard', 'label' => 'Tugas Kelompok', 'page' => 'tugasDosen'],
        ['icon' => 'activity',  'label' => 'Monitoring',  'page' => 'monitoring'],
        ['icon' => 'award',     'label' => 'Penilaian',   'page' => 'penilaian'],
    ],
    'admin' => [
        ['icon' => 'dashboard', 'label' => 'Dashboard',   'page' => 'dashboard'],
        ['icon' => 'users',     'label' => 'Kelola User', 'page' => 'manageUser'],
        ['icon' => 'layers',    'label' => 'Kelola Kelompok', 'page' => 'manageKelompok'],
    ],
];
$currentPage = $_GET['page'] ?? 'dashboard';
$currentMenu = $menus[$role] ?? [];

function icon(string $name): string {
    $icons = [
        'dashboard' => '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'clipboard' => '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
        'calendar'  => '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        'upload'    => '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
        'users'     => '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
        'award'     => '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        'activity'  => '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'layers'    => '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    ];
    return $icons[$name] ?? '';
}
?>

<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="brand-name">SMPM</div>
    <div class="brand-sub">Sistem Manajemen Proyek Mahasiswa</div>
  </div>
  <nav class="sidebar-nav">
    <?php foreach ($currentMenu as $item): ?>
    <a href="index.php?page=<?= urlencode($item['page']) ?>"
       class="nav-item <?= $currentPage === $item['page'] ? 'active' : '' ?>">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <?= icon($item['icon']) ?>
      </svg>
      <?= htmlspecialchars($item['label']) ?>
    </a>
    <?php endforeach; ?>
  </nav>
  <div class="sidebar-footer">
    <div class="user-pill">
      <div class="avatar"><?= htmlspecialchars($user['avatar']) ?></div>
      <div>
        <div class="user-name"><?= htmlspecialchars($user['nama']) ?></div>
        <div class="user-role"><?= ucfirst(htmlspecialchars($user['role'])) ?></div>
      </div>
    </div>
    <a href="index.php?action=logout" class="btn btn-outline w-full mt-8"
       style="color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.2);background:transparent;font-size:.8rem;justify-content:center;text-decoration:none">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
      Keluar
    </a>
  </div>
</aside>

<header class="topbar">
  <div class="topbar-title"><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?></div>
  <div class="topbar-actions">
    <div class="icon-btn notif-dot" title="Notifikasi">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    </div>
  </div>
</header>
