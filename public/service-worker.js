const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/manifest.webmanifest",
    "/style.css"
];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const log = arg => {
    console.log(arg);
}

self.addEventListener("install", evt => {
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                log("Your files were pre-cached successfully!");
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting
});

self.addEventListener("activate", evt => {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            )
        })
    )
    self.clients.claim();
});

self.addEventListener("fetch", evt => {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then(cache => {
                    return fetch(evt.request)
                        .then( response => {
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response
                        })
                        .catch(err => {
                            return cache.match(evt.request);
                        });
                })
                .catch(err => log(err))
        );
        return;
    }
    evt.respondWith(
        caches.match(evvt.request)
            .then(response => {
                return response || fetch(evt.request);
            })
    );
});
