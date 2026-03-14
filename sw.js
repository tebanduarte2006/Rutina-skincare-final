const CACHE_VERSION = "v2"
const CACHE_NAME = "rutina-cache-" + CACHE_VERSION

const ASSETS = [
"/",
"/index.html",
"/styles.css",
"/app.js",
"/manifest.json"
]

self.addEventListener("install", event => {

event.waitUntil(

caches.open(CACHE_NAME)
.then(cache => {
return cache.addAll(ASSETS)
})

)

self.skipWaiting()

})

self.addEventListener("activate", event => {

event.waitUntil(

caches.keys().then(keys => {

return Promise.all(

keys.map(key => {

if(key !== CACHE_NAME){
return caches.delete(key)
}

})

)

})

)

self.clients.claim()

})

self.addEventListener("fetch", event => {

event.respondWith(

caches.match(event.request)
.then(response => {

if(response){
return response
}

return fetch(event.request)

})

)

})
