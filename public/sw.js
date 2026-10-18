// Servis çalışanı: önce ağ, bağlantı yoksa önbellek (güncellemeler hemen gelir, çevrimdışı da açılır)
const CACHE = 'mangala-v3.3';
const ASSETS = ['./', 'index.html', 'css/style.css', 'js/engine.js', 'js/data.js', 'js/i18n.js', 'js/audio.js', 'js/app.js', 'js/play.js', 'js/admin.js', 'js/fx.js', 'js/camera.js', 'js/chatplay.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
