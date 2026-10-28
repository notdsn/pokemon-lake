// Service worker: só faz cache de arquivos do app. NUNCA mexe em localStorage/IndexedDB (saves).
const V = 'pkl-v41';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'pkl-media').map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/\/(img|cries)\//.test(u.pathname)) { // mídia: cache primeiro
    e.respondWith(caches.open('pkl-media').then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { if (n.ok) c.put(e.request, n.clone()); return n; }))));
  } else { // código: rede primeiro (atualizações chegam logo), cache como reserva offline
    e.respondWith(fetch(e.request).then(n => { if (n.ok) caches.open(V).then(c => c.put(e.request, n.clone())); return n; }).catch(() => caches.match(e.request)));
  }
});
