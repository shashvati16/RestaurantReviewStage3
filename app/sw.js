importScripts('js/idb.js');
var webCache = 'mws-restaurant-003';

const dbPromise = idb.open('restaurantDb', 1 , upgradeDB =>{
  switch(upgradeDB.oldVersion){
    case 0:
      upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });

    case 1:
    {
      upgradeDB.createObjectStore('reviews', { keyPath: 'id' });
    }
    case 2:
    upgradeDB.createObjectStore("pending", {
      keyPath: "id",
      autoIncrement: true
  });

  }
});


self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(webCache).then(cache => {
            return cache.addAll( ['/',
            '/index.html',
            '/restaurant.html',
            '/js/idb.js',
             'js/util.js',
             'js/tether.min.js',
             'js/bootstrap.min.js',
             'js/jquery.min.js',
             'js/fontawesome.min.js',
            '/js/register.js',
            '/js/main.js',
            '/js/dbhelper.js',
            '/js/restaurant_info.js',
            '/img/error.png',
            '/css/styles.css',
            '/css/bootstrap.css',
            'css/fontawesome.min.css',
            '/manifest.json',
            '/icons/',
            '/img/'
            ]);
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
  if(event.request.url.indexOf('/restaurant.html') > -1){
    const cacheURL = 'restaurant.html';
    cacheRequest = new Request(cacheURL);
  }

  const urlCheck = new URL(event.request.url);
  if (urlCheck.port=='1337'){
    const parts = urlCheck.pathname.split('/');

    if(urlCheck.pathname.indexOf('restaurants')){
      id = parts[parts.length-1] === 'restaurants'
      ? '-1'
      : parts[parts.length -1];
      }
    else {
      id = urlCheck.searchParams.get("restaurant_id");
    }
    handleAJAXEvent(event, id);
  }else{
    handleNonAJAXEvent(event, cacheRequest);
  }
});
const handleAJAXEvent = (event, id) => {
/* if (event.request.method !== 'GET') {
    return fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(json => {
        return json;
      });
  }*/

  if (event.request.url.indexOf('reviews') > -1) {
    handleReview(event, id);
  }
  else {
    handleRestaurant(event, id);
  }
};
const handleReview = (event, id) => {
  event.respondWith(
    dbPromise.then(db => {
      return db
        .transaction('reviews')
        .objectStore('reviews')
        .get(id);
    })
    .then(data => {
      return (data.length && data.data) ||
      fetch(event.request)
      .then(fetchResponse => fetchResponse.json())
      .then(data => {
        return dbPromise.then(rdb => {
          const rtx = rdb.transaction('reviews','readwrite');
          const store = rtx.objectStore("reviews");
           store.put({
            id: id,
            data: json
          });

          return json;
        });
      });
  }).then(finalResponse => {
    return new Response(JSON.stringify(finalResponse));
  }).catch(error => {
    return new Response('Error fetching data' + error, { status: 500});
  })
);

};
const handleRestaurant = (event, id) => {
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
