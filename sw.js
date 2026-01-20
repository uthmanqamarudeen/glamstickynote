const CACHE_NAME = 'glamstickynote-v1';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
