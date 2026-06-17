/* 한눈에 보는 성경 이야기 — 서비스워커 (오프라인 캐시)
   - 네비게이션(HTML): network-first → 실패 시 캐시 → 최후엔 루트
   - 정적 자원(JSON/이미지/CSS): cache-first + 런타임 캐시
   - 동일 출처만 캐시(GA 등 외부는 통과) */
const CACHE = 'osb-v2';
const PRECACHE = ['/', '/manifest.webmanifest', '/og.png', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(GA 등)는 그대로 통과

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return res;
    }))
  );
});
