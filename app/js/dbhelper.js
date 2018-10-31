
/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }
  static get Reviews_URL(){
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let restaurantURL;
    if (!id) {
      restaurantURL = DBHelper.DATABASE_URL;
    }
    else {
      restaurantURL = DBHelper.DATABASE_URL + '/' + id;
    }
    fetch(restaurantURL, {method: 'GET'})
      .then(response => {
        response.json().then(restaurants => {
          console.log('restaurants JSON: ', restaurants);
         if(id) {
            addRestauranttoStore(restaurants, id);
          }
          callback(null, restaurants);
        });
      }).catch(error =>{
        callback('Request failed: ${error}', null);
      });

    }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants;
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    }, id);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`../restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(restaurant.photograph){
     return (`/img/${restaurant.photograph}.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static updateRestaurantStatus(id, is_favorite){
    let statusUrl = DBHelper.DATABASE_URL + '/' + id + '/?' + 'is_favorite=' + is_favorite;
    fetch (statusUrl, {
      method: 'PUT'
    }).then(response => response.json())
    .catch(error => console.error('Error:', error))
    .then(response => console.log('Success:', response));

  }

  static fetchReviews(callback, id) {
    let reviewsUrl;
    if (!id) {
      reviewsUrl = DBHelper.Reviews_URL;
    }
    else {
      reviewsUrl = DBHelper.Reviews_URL + "?restaurant_id="  + id;
    }
    fetch(reviewsUrl, {method: 'GET'})
      .then(response => {
        response.json().then(reviews => {
          console.log('reviews JSON: ', reviews);
          addReviewstoStore(reviews,id);
          callback(null, reviews);
        });
      }).catch(error =>{
        callback('Request failed: ${error}', null);
      });
  }

/**
   * Fetch a reviews by its restaurant Id.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews;
        if (review) { // Got the restaurant reviews
          callback(null, review);
        } else { // Restaurant reviews does not exist in the database
          callback('Restaurant reviews does not exist', null);
        }
      }
    }, id);
  }
  /**
   * update review by review id
   */
  static updateReviewsByreviewId(reviewId, data){
    let reviewsUrl = DBHelper.Reviews_URL + reviewId;
    const method = 'PUT';
    addToPendingQueue(reviewsUrl,method,reviewId,data);
    /*fetch(reviewsUrl, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
    .catch(error => {
      console.error('Error:', error);

    })
    .then(response => console.log('Success:', response));*/
  }

/**
 * Add review by its restaurant Id.
 */
  static addReviewsByRestaurantId(data, restaurantID){
    let reviewsUrl = DBHelper.Reviews_URL;
    const method = 'POST';
    addToPendingQueue(reviewsUrl,method,restaurantID,data);
   /* fetch(reviewsUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response =>  response.json())
    .catch(error => {
      console.error('Error:', error);
    })
    .then(response => console.log('Success:', response))
    .catch(err=>{
       console.error('Error:', error);

    });*/
  }



  /**
   * Delete reviews by review Id
   */
  static deleteReviewsByReviewId(id){
    let reviewsUrl = DBHelper.Reviews_URL + id;
    fetch(reviewsUrl, {
      method: 'DELETE',
    }).then(response => response.json())
    .catch(error => console.error('Error:', error))
    .then(response => console.log('Success:', response));
  }

}

