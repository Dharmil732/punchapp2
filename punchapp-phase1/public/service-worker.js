
self.addEventListener('install', ()=>self.skipWaiting());
self.addEventListener('activate', ()=>self.clients.claim());

self.addEventListener('push', (e)=>{
  let data = {}; try { data = e.data.json() } catch(_){}
  const title = data.title || 'Punch';
  const body = data.body || 'Notification';
  e.waitUntil(self.registration.showNotification(title, { body }));
});

self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
