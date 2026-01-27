const CACHE_NAME = 'glamstickynote-v7'; // Updated to v7 for Splash Screen & Notifications
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/preview.png'
    // Note: Google Fonts removed - external fonts cause CORS issues when caching
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
        // Removed .catch() to let the error bubble up and fail installation if caching fails
        // This is crucial for PWA criteria debugging
    );
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).catch(() => {
                // Fallback for offline - return cached index for navigation requests
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
