// PWA Handler for Asr Kareem
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker Registered'))
            .catch(err => console.error('[PWA] Registration Failed', err));
    });
}

let deferredPrompt;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-install-btn');
const headerInstallBtn = document.getElementById('pwa-header-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (headerInstallBtn) headerInstallBtn.style.display = 'flex';
    
    // Show banner after 3 seconds
    const isDismissed = localStorage.getItem('pwa-banner-dismissed');
    if (!isDismissed) {
        setTimeout(() => {
            if (installBanner) installBanner.style.bottom = '20px';
        }, 3000);
    }
});

async function triggerInstallPrompt() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installBanner) installBanner.style.bottom = '-200px';
    if (headerInstallBtn) headerInstallBtn.style.display = 'none';
}

if (installBtn) installBtn.addEventListener('click', triggerInstallPrompt);
if (headerInstallBtn) headerInstallBtn.addEventListener('click', triggerInstallPrompt);

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (installBanner) installBanner.style.bottom = '-200px';
        localStorage.setItem('pwa-banner-dismissed', 'true');
    });
}
