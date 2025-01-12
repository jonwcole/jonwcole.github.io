const CACHE_NAME = 'horrordle-v1';
const ASSETS_TO_CACHE = [
    'https://www.horrordle.app/beta/',
    'https://jonwcole.github.io/horrordle/horrordle-v0.9.6.0.js',
    'https://cdn.prod.website-files.com/65f6874e5f83391382f1899f/css/horrordle.webflow.ed75adc46.min.css',
    'https://jonwcole.github.io/horrordle/dictionary-v1.2.json',
    'https://jonwcole.github.io/horrordle/words-v1.6.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        // Cache new requests
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    });
            })
    );
}); 