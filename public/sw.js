const CACHE="gado-v1";
const ASSETS=["/","/index.html","/manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  if(e.request.url.includes("pocketbase")||e.request.url.includes("/api/"))return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(res&&res.status===200){const c=res.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));}
    return res;
  }).catch(()=>caches.match("/index.html"))));
});
