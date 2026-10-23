const VERSION='starry-life-v1-4-midnight-gold-20261023';
const ASSETS=['/','/index.html','/src/app.mjs','/src/numerology.mjs','/src/content.mjs','/src/styles.css','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('starry-life-')&&key!==VERSION).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(req).then(cached=>cached||new Response('離線時無法取得此頁面',{status:503}))));});
