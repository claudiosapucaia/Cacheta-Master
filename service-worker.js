const CACHE = "cacheta-master-v4-1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/storage.js",
  "./js/game.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(chave => chave !== CACHE).map(chave => caches.delete(chave))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then(resposta => resposta || fetch(event.request))
      .catch(() => caches.match("./index.html"))
  );
});
