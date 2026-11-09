// Cho trang mở được khi mất mạng. Luôn lấy bản mới trước, mất mạng mới dùng bản đã lưu.
// Không đụng tới dữ liệu thu chi (dữ liệu nằm trong localStorage của trình duyệt, đã mã hóa).
const CACHE = 'ghi-chu-v4';
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const FILES = ['./', './index.html', './app.js', './vendor/lordicon.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && !FONTS.includes(u.hostname)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
