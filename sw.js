const CACHE_NAME = 'aser-kareem-v1.5';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/logo.png',
    '/firebase-config.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap'
];

// Install Event - Pre-caching static assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the new service worker to become active immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching essential assets');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control of all clients immediately
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                );
            })
        ])
    );
});

// Fetch Event - Stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    // Skip core functionality APIs (Firebase, Cloudinary) to ensure they always use real-time connection
    if (url.includes('firestore.googleapis.com') || 
        url.includes('api.cloudinary.com') ||
        url.includes('firebasestorage.googleapis.com') ||
        url.includes('identitytoolkit.googleapis.com')) {
        return;
    }

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Check if response is valid before caching
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback - handle missing network
                console.log('[SW] Fetch failed, using cache if available');
            });

            return cachedResponse || fetchPromise;
        })
    );
});
