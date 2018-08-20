let restaurant;
var map;
let reviews;
let id;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      fetchReviewsFromURL(null, id);
      callback(null, restaurant);
    });
  }
};
/**
 * Get current restaurant from page URL.
 */
const fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // reviews already fetched!
    callback(null, self.reviews);
    return;
  }
  id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      //callback(null, reviews);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  const imageurlbase = DBHelper.imageUrlForRestaurant(restaurant,'img');
  const imgparts = imageurlbase.split('.');
  const imgurl1x = imgparts[0] + '_1X.' + imgparts[1];
  const imgurl2x = imgparts[0] + '_2X.' + imgparts[1];
  image.src = imgurl2x;
  image.srcset = `${imgurl1x} 300w, ${imgurl2x} 600w`;
  image.alt = restaurant.name + ' restaurant promotional image';


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);

  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.append(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const update = document.createElement('i');
  update.className = 'fa fa-pencil';
  update.style = 'font-size:24px;margin-right:10px';
  update.setAttribute('data-toggle', 'modal');
  update.setAttribute('data-target', 'reviewUpdateModal');
  li.appendChild(update);
  let reviewId = review.id;
  li.appendChild(createModal(reviewId));
  update.onclick = function(){
    $('#reviewUpdateModal').modal('show');
    $('#reviewUpdateModal').on('shown.bs.modal', function(){
      $('#reviewer_name').val(review.name);
      $('#comments_text').val(review.comments);
      $('#rate').val(review.rating);
    });
  };

  const deleteIcon = document.createElement('i');
  deleteIcon.className = 'fa fa-trash';
  deleteIcon.style = 'font-size:24px';
  deleteIcon.onclick = function(){
    DBHelper.deleteReviewsByReviewId(reviewId);
    window.location.reload();
  };
  li.appendChild(deleteIcon);
  li.tabIndex = 1;
  return li;
};

const createModal = (reviewId) =>{
  const modal = document.createElement('div');
  modal.className='modal fade';
  modal.id = 'reviewUpdateModal';
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('role','dialog');
  modal.style='display: none';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML = `<div class="modal-dialog" role="document">
  <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Update review</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form class="form">
          <div class="form-group">
            <label for="reviewer_name" class="col-form-label">Name:</label>
            <input type="text" class="form-control" id="reviewer_name">
          </div>
          <div class="form-group">
            <label for="comments_text" class="col-form-label">Comments:</label>
            <textarea class="form-control" id="comments_text" rows="5"></textarea>
          </div>
          <div class="form-group" id="ratingdrpdwn">
            <label for="inputRating">Rating</label>
            <select id="rate" class="form-control">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn btn-default btn-default pull-left" data-dismiss="modal" onclick="updateReviewById( ` + reviewId + `)">Update</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
  return modal;
};

const updateReviewById = (reviewId) =>{
  let reviewerName = document.getElementById('reviewer_name').value;
  let reviewerDrpDwn = document.getElementById('rate');
  let reviewRating = reviewerDrpDwn.options[reviewerDrpDwn.selectedIndex].value;
  let comments = document.getElementById('comments_text').value;
  let review = {
    "name": reviewerName,
    "rating": reviewRating,
    "comments": comments
  };
  DBHelper.updateReviewsByreviewId(reviewId,review);
  window.location.reload();
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = window.location;
  li.innerHTML = restaurant.name;
  a.setAttribute('aria-current','page');
  li.appendChild(a);
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Create a review by restaurant id
 */
const addReviewByRestaurantId = () => {
  let reviewerName = document.getElementById('reviewer-name').value;
  let reviewerDrpDwn = document.getElementById('rating');
  let reviewRating = reviewerDrpDwn.options[reviewerDrpDwn.selectedIndex].value;
  let comments = document.getElementById('comments-text').value;
  let review = {
    "restaurant_id": id,
    "name": reviewerName,
    "rating": reviewRating,
    "comments": comments
  };
  DBHelper.addReviewsByRestaurantId(review);
  window.location.reload();
};
