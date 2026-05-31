const CACHE_NAME = 'me-opt-v1.0.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/generic-fridge.svg',
  './img/generic-microwave.svg',
  './img/generic-oven.svg',
  './img/generic-hood.svg',
  './img/generic-hob.svg',
  './img/generic-dishwasher.svg'
];

// Instalacja - cache'owanie kluczowych zasobów
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktywacja - czyszczenie starego cache'u przy aktualizacji wersji
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Strategia sieciowa: cache-first z powrotem do sieci i dynamicznym cache'owaniem
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Dynamicznie cache'ujemy nowo wgrane zdjęcia sprzętów z katalogu img/
          if (e.request.url.includes('/img/')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback przy braku internetu i braku w cache
          if (e.request.url.includes('/img/')) {
            // Spróbuj przekierować na uniwersalny obrazek o odpowiednim typie,
            // jeśli np. nie ma zdjęcia konkretnego indeksu
            const url = new URL(e.request.url);
            if (url.pathname.includes('oven')) return caches.match('./img/generic-oven.svg');
            if (url.pathname.includes('hob')) return caches.match('./img/generic-hob.svg');
            if (url.pathname.includes('fridge')) return caches.match('./img/generic-fridge.svg');
            if (url.pathname.includes('microwave')) return caches.match('./img/generic-microwave.svg');
            if (url.pathname.includes('hood')) return caches.match('./img/generic-hood.svg');
            if (url.pathname.includes('dishwasher')) return caches.match('./img/generic-dishwasher.svg');
          }
        });
    })
  );
});
