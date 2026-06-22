function rememberHashBeforeReload() {
  if (window.location.hash) {
    window.sessionStorage.setItem('tboy1337-pending-hash', window.location.hash);
  }
}

function showServiceWorkerUpdateBanner() {
  if (document.getElementById('sw-update-banner')) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.className = 'sw-update-banner';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <p class="sw-update-banner-text">A new version of this site is available.</p>
    <div class="sw-update-banner-actions">
      <button type="button" id="sw-update-refresh" class="sw-update-banner-btn sw-update-banner-btn-primary">Refresh</button>
      <button type="button" id="sw-update-dismiss" class="sw-update-banner-btn">Later</button>
    </div>
  `;
  document.body.appendChild(banner);

  const refreshButton = document.getElementById('sw-update-refresh');
  const dismissButton = document.getElementById('sw-update-dismiss');
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      rememberHashBeforeReload();
      window.location.reload();
    });
  }
  if (dismissButton) {
    dismissButton.addEventListener('click', function() {
      banner.remove();
    });
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { type: 'module' })
      .then(function(registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) {
            return;
          }
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showServiceWorkerUpdateBanner();
            }
          });
        });

        registration.update();
      })
      .catch(function(error) {
        console.warn('ServiceWorker registration failed:', error);
      });
  });
}
