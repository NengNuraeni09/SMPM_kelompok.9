<!-- Toast container (untuk notifikasi flash) -->
<div class="toast-container" id="toast-container">
<?php if (!empty($_SESSION['flash_success'])): ?>
  <div class="toast success" id="flash-toast">
    ✓ <?= htmlspecialchars($_SESSION['flash_success']) ?>
  </div>
  <?php unset($_SESSION['flash_success']); ?>
<?php elseif (!empty($_SESSION['flash_error'])): ?>
  <div class="toast error" id="flash-toast">
    ✕ <?= htmlspecialchars($_SESSION['flash_error']) ?>
  </div>
  <?php unset($_SESSION['flash_error']); ?>
<?php endif; ?>
</div>

<!-- Modal overlay -->
<div id="modal-overlay" class="modal-overlay hidden">
  <div class="modal" id="modal-body"></div>
</div>

<script src="js/app.js"></script>
<script>
  // Auto-dismiss flash toast
  const ft = document.getElementById('flash-toast');
  if (ft) setTimeout(() => ft.style.animation = 'fadeOut .4s forwards', 3000);

  // Modal close on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', function(e) {
    if (e.target === this) this.classList.add('hidden');
  });
</script>
</body>
</html>
