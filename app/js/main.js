let restaurants,
  neighborhoods,
  cuisines;
let reviews;
let map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});



/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  cSelect.setAttribute('aria-label', 'Select by cuisines');
  nSelect.setAttribute('aria-label', 'Select by neighborhoods');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });

};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
    DBHelper.fetchReviewsByRestaurantId(restaurant.id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
    });
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  const imageurlbase = DBHelper.imageUrlForRestaurant(restaurant,'img');
  const imgparts = imageurlbase.split('.');
  const imgurl1x = imgparts[0] + '_1X.' + imgparts[1];
  const imgurl2x = imgparts[0] + '_2X.' + imgparts[1];

  image.src = imgurl1x;
  image.srcset = `${imgurl1x} 300w, ${imgurl2x} 600w`;
  image.alt = restaurant.name + ' restaurant promotional image';
  li.append(image);

  const div = document.createElement('div');
  div.className = 'restaurant-details-text';
  li.append(div);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  div.append(name);

  const favorite = document.createElement('img');
  favorite.width = 32;

  favorite.setAttribute('aria-label','favorite');
  favorite.tabIndex = 0;

  if(restaurant.is_favorite==true){
    favorite.src = '../img/On.svg';
  }
  if (restaurant.is_favorite==false){
    favorite.src = '../img/Off.svg';
  }


  favorite.onclick = function() {
    if(restaurant.is_favorite == false){
      favorite.src = '../img/On.svg';
      restaurant.is_favorite = true;
      DBHelper.updateRestaurantStatus(restaurant.id,restaurant.is_favorite);
    }
    else{
      favorite.src = '../img/Off.svg';
      restaurant.is_favorite = false;
      DBHelper.updateRestaurantStatus(restaurant.id,restaurant.is_favorite);
    }

  };
  div.append(favorite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  div.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  div.append(address);


  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label','view Details of' + restaurant.name);
  more.onclick = function() {
    const resturantDetailUrl = DBHelper.urlForRestaurant(restaurant);
    window.location = resturantDetailUrl;
  };
  div.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
