const CACHE = 'flevo-v5.12';
const STATIC = [
  './', './index.html', './projects.html', './gallery.html',
  './articles.html', './profile.html',
  './assets/flevo-app.css', './assets/site.css', './assets/motion.css',
  './assets/flevo-header-v512.css', './assets/unified-auth.css',
  './assets/flevo-header-v512.js', './assets/motion.js',
  './assets/quote.js', './assets/i18n.js',
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
