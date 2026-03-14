const CACHE="rutina-v1"

const ASSETS=[
"./",
"./index.html",
"./styles.css",
"./app.js",
"./manifest.json"
]

self.addEventListener("install",e=>{

e.waitUntil(
caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
)

self.skipWaiting()

})

self.addEventListener("activate",e=>{

e.waitUntil(

caches.keys().then(keys=>
Promise. all(
keys.map(k=>{
if(k!==CACHE)return caches.delete(k)
})
)
)

)

})

self.addEventListener("fetch",e=>{

e.respondWith(

caches.match(e.request).then(r=>r||fetch(e.request))

)

})

self.addEventListener("message",e=>{

if(e.data==="SKIP_WAITING")self.skipWaiting()

})
