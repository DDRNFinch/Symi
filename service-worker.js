const BUILD='0.26.0';
const CACHE=`symi-${BUILD}`;
const ASSETS=[
  './','./index.html',
  `./style.css?v=${BUILD}`,
  `./staff-style.css?v=${BUILD}`,
  `./samos-theme.css?v=${BUILD}`,
  `./symi-week-calendar-v023.css?v=${BUILD}`,
  `./symi-standard-ui-v024.css?v=${BUILD}`,
  `./symi-calendar-manager-v025.css?v=${BUILD}`,
  `./symi-home-polish-v025.css?v=${BUILD}`,
  `./symi-home-scale-v027.css?v=${BUILD}`,
  `./evia-animations.js?v=${BUILD}`,
  `./qr-engine.js?v=${BUILD}`,
  `./app.js?v=${BUILD}`,
  `./naxos-controller.js?v=${BUILD}`,
  `./symi-brand-v017.js?v=${BUILD}`,
  `./symi-otj-share-v017.js?v=${BUILD}`,
  `./symi-course-hub-v018.js?v=${BUILD}`,
  `./symi-teaching-v019.js?v=${BUILD}`,
  `./symi-attendance-cap-v020.js?v=${BUILD}`,
  `./symi-data-hub-v021.js?v=${BUILD}`,
  `./symi-course-first-v021.js?v=${BUILD}`,
  `./symi-week-calendar-v023.js?v=${BUILD}`,
  `./symi-standard-ui-v024.js?v=${BUILD}`,
  `./symi-home-polish-v025.js?v=${BUILD}`,
  `./manifest.json?v=${BUILD}`,
  `./manifest.webmanifest?v=${BUILD}`,
  `./icon-192.png?v=${BUILD}`,
  `./icon-512.png?v=${BUILD}`,
  `./icon-maskable-192.png?v=${BUILD}`,
  `./icon-maskable-512.png?v=${BUILD}`,
  `./apple-touch-icon.png?v=${BUILD}`,
  `./favicon-32.png?v=${BUILD}`
];

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS);
  await self.skipWaiting();
})()));

self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>/^(?:samos|symi)-/i.test(k)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch(_){
        return (await caches.match('./index.html'))||(await caches.match('./'))||Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      const response=await fetch(request,{cache:'no-store'});
      if(response.ok){
        const cache=await caches.open(CACHE);
        await cache.put(request,response.clone());
        return response;
      }
      const cached=await caches.match(request,{ignoreSearch:true});
      return cached||response;
    }catch(_){
      return (await caches.match(request,{ignoreSearch:true}))||Response.error();
    }
  })());
});
