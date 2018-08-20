import idb from 'idb';
var webCache = 'mws-static-001';

//var imgCache = 'mws-static-imgs';
const dbPromise = idb.open('restaurant-db', 2, upgradeDB =>{
  switch(upgradeDB.oldVersion){
    case 0:
      upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});

    }
});


var urlsToCache = ['/',
'/index.html',
'/restaurant.html',
'/js/register.js',
'/js/main.js',
'/js/dbhelper.js',
'/js/restaurant_info.js',
'/img/error.png',
'/css/styles.css',
];
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(webCache).then(cache => {
            return cache.addAll(urlsToCache);
          })
    );
});
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-') &&
                 !webCache.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
self.addEventListener('fetch', event => {
  let cacheRequest = event.request;
  let cacheObj = new URL(event.request.url);
  if(event.request.url.indexOf('/restaurant.html') > -1){
    const cacheURL = 'restaurant.html';
    cacheRequest = new Request(cacheURL);
  }
  //event.request.mode = 'no-cors';

  const urlCheck = new URL(event.request.url);
  if (urlCheck.port=='1337'){
    const parts = urlCheck.pathname.split('/');
    const id = parts[parts.length-1] === 'restaurants'
    ? '-1'
    : parts[parts.length -1];
    handleAJAXEvent(event, id);
  }else{
    handleNonAJAXEvent(event, cacheRequest);
  }
});
const handleAJAXEvent = (event, id) => {
  event.respondWith(
    dbPromise.then(db => {
      return db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(id);
    })
    .then(data => {
      return ((data && data.data) ||
      fetch(event.request).then(fetchResponse => fetchResponse.json())
      .then(json => {
        return dbPromise.then( db => {
          const tx = db.transaction('restaurants','readwrite');
          tx.objectStore('restaurants').put({
            id: id,
            data: json
          });
          return json;
        });
    })
    );
  }).then(finalResponse => {
    return new Response(JSON.stringify(finalResponse));
  })
  .catch(error => {
    return new Response('Error fetching data' + error, { status: 500});
  })
);
};
const handleNonAJAXEvent = (event, cacheRequest) => {
event.respondWith(
  caches.match(cacheRequest).then(function(response) {
    return response ||
    fetch(event.request)
      .then (eventresponse => {
        return caches.open(cacheID).then(cache => {
          cache.put(event.request, eventresponse.clone());
          return eventresponse;
        });
      }).catch(error => {
        if(event.request.url.indexOf('.jpg') > -1){
          return caches.match('/img/error.png');
        }
        return new Response('Application is not connected to the internet' , {
          status: 404,
          statusText: 'Application is not connected to the internet'
        }
        );
      });
  })
);
};
self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
