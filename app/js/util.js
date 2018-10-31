
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
        keyPath: "id"
    });

  }
});
const addRestauranttoStore = (restaurants, id) => {
  dbPromise.then (db => {
    const tx = db.transaction('restaurants','readwrite');
    tx.objectStore('restaurants').put({
      id: id,
      data: restaurants
    });
  });
  return restaurants;
};


const addReviewstoStore = (review, id) => {
    dbPromise.then (db => {
      const tx = db.transaction('reviews','readwrite');
      tx.objectStore('reviews').put({
        id: id,
        data: review
      });
    });
    return review;
};
const addToPendingQueue = (url, method, id, data) => {
  dbPromise.then (db => {
    const tx = db.transaction('pending','readwrite');
    tx.objectStore('pending').put({
      id: id,
      data: {
        url,
        method,
        data
      }
    });
  })
  .then(releasePending());
};
const releasePending= (callback) => {
  dbPromise.then(db => {
    if (!db.objectStoreNames.length) {
      console.log("DB not available");
      db.close();
      return;
    }
    const tx = db.transaction("pending", "readwrite");
      tx
        .objectStore("pending")
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return;
          }

          url = cursor.value.data.url;
          method = cursor.value.data.method;
          body = cursor.value.data.data;
          const properties = {
            body: JSON.stringify(body),
            method: method
          };
          console.log("sending post from queue: ", properties);
          fetch(url, properties)
            .then(response => {

            if (!response.ok && !response.redirected) {
              return;
            }
          })
            .then(() => {
              // Success! Delete the item from the pending queue
              const dtx = db.transaction("pending", "readwrite");
              dtx
                .objectStore("pending")
                .openCursor()
                .then(cursor => {
                  cursor
                    .delete()
                    .then(() => {
                      callback();
                    });
                });
              console.log("deleted pending item from queue");
            });
        })
        .catch(error => {
          console.log("Error reading cursor");
          return;
        });
    });
};
