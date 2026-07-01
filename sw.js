/* 한눈에 보는 성경 이야기 — 서비스워커 (오프라인 캐시)
   - 콘텐츠(HTML 네비게이션 + /i18n/*.json): network-first → 온라인이면 항상 최신, 실패 시 캐시 → 최후엔 루트
     (i18n 본문은 자주 갱신되므로 cache-first 면 배포해도 재방문자에게 옛 내용이 남는다 → network-first 필수)
   - 정적 자원(이미지/CSS/폰트/매니페스트): cache-first + 런타임 캐시
   - 동일 출처만 캐시(GA 등 외부는 통과)
   - CACHE 이름은 build-pages 가 index.html 해시로 스탬프 → 셸 변경 시 자동 무효화 */
const CACHE = 'osb-505313d0';
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

  // 콘텐츠(HTML 네비게이션 + i18n JSON + about·maps 데이터): network-first (온라인이면 항상 최신)
  // /about/·/maps/ 의 data.json 은 배포마다 갱신되므로 cache-first 면 재방문자에게 옛 데이터(좌표 누락 등)가 남는다 → network-first 필수
  const isContent = req.mode === 'navigate' || url.pathname.startsWith('/i18n/') || url.pathname.startsWith('/about/') || url.pathname.startsWith('/maps/');
  if (isContent) {
    e.respondWith(
      fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/')))
    );
    return;
  }
  // 정적 자원: cache-first
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return res;
    }))
  );
});
