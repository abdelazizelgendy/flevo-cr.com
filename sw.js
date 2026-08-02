const CACHE = 'flevo-v5.12';
const STATIC = [
  './', './index.html', './projects.html', './gallery.html',
  './articles.html', './profile.html',
  './assets/flevo-app.css?v=5.12', './assets/site.css?v=5.12',
  './assets/motion.css?v=5.12', './assets/flevo-header-v512.css?v=5.12',
  './assets/unified-auth.css?v=5.12',
  './assets/flevo-header-v512.js?v=5.12', './assets/motion.js?v=5.12',
  './assets/quote.js?v=5.12', './assets/quote.css?v=5.12',
  './assets/i18n.js?v=5.12',
  './assets/flevo-logo-on-dark.png', './manifest.webmanifest'
];

self.addEventListener('install', e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
);

self.addEventListener('fetch', e => {
  if (e.request.url.includes('supabase.co')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
