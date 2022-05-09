
const transitBaseUrl = 'https://api.winnipegtransit.com/v3/';
const transitEndpoint = 'trip-planner';
const transitAPIKey = 'api-key=zhiBw4XgSGqmE7QxCVwn';
const transitEnd = 'origin=geo/';
const transitdest = 'destination=geo/';

const baseMapBox = 'https://api.mapbox.com/geocoding/v5/';
const endMapBox = 'mapbox.places/';
const mapbbox = 'bbox=-97.325875, 49.766204, -96.953987, 49.99275';
const acessMap = 'access_token=pk.eyJ1Ijoic3VzaGFudGVuZGVyc2dhbWUyIiwiYSI6ImNsMnhnMWRnMTAwZ2IzYnMwZDRuOXlwa3IifQ.KcB4R-F9NIQNnOyiwY_gWA';


const recommenedContainer = document.querySelector('.recommended-container');
const alternativeTripHeading = document.querySelector('.alternative');




async function locationData(search) {
  try {
    const response = await fetch(`${baseMapBox}${endMapBox}${search}.json?${mapbbox}&${acessMap}`);
    const data = await response.json();
    return data.features;
  } catch (error) {
    return console.log(error);
  }
}

async function dataPath(originLat, originLon, destLat, destLon) {
  try {
    const response = await fetch(`${transitBaseUrl}${transitEndpoint}.json?${transitAPIKey}&${transitEnd}${originLat},${originLon}&${transitdest}${destLat},${destLon}`);
    return await response.json();
  } catch (error) {
    return console.log(error);
  }
}

function locationHTML(arrLocation, attachedElement) {
  arrLocation.forEach(locationObj => {
    attachedElement.insertAdjacentHTML('beforeend',
    `<li class="location" data-long="${locationObj.center[0]}" data-lat="${locationObj.center[1]}">
    <div class="name">${LocationName(locationObj['place_name'])}</div>
    <div>${adressbul(locationObj)}</div>
    </li>`);
  });
}


function LocationName(locationString) {
  return locationString.split(',')[0];
}

function adressbul(locationObj) {
  if (locationObj.properties.address === undefined) {
    return 'Winnipeg';
  } else {
    return locationObj.properties.address;
  }
}

function clear(element) {
  element.innerHTML = '';
}

function loactioninfo(inputElement, attachedElement) {
  locationData(inputElement.value)
  .then(data => {
    if (ValidLocationCheck(data, attachedElement)) {
      clear(attachedElement);
      locationHTML(data, attachedElement);
    }
  })
}

function ValidLocationCheck(array, element) {
  if (array.length === 0) {
    element.textContent = 'No location found.';
    return false;
  } else {
    return true;
  }
}

function classChanges(element, listType) {
  element.classList.add('selected');
  const allSelected = document.querySelectorAll(`.${listType} .selected`);
  allSelected.forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
}

const selectedOrigins = document.querySelectorAll('.origins .selected');
const selectedDestinations = document.querySelectorAll('.destinations .selected');
recommenedContainer.innerHTML = '';

function userSelection() {
  if (selectedOrigins.length === 0) {
    recommenedContainer.insertAdjacentHTML('after', '<p>Please select a start location.</p>');
    return false;
  } else if (selectedDestinations.length === 0) {
    recommenedContainer.insertAdjacentHTML('after', '<p>Please select a destination.</p>');
    return false;
  } else {
    return true;
  }
}

function userOrigin() {
  const possibleOrigins = document.querySelectorAll('.origins li');
  let selectedOrigin;
  
  for (const locationItem of possibleOrigins) {
    if (locationItem.classList.contains('selected')) {
      selectedOrigin = locationItem;
    }
  }
  return selectedOrigin;
}

function userDestination() {
  const possibleDestinations = document.querySelectorAll('.destinations li');
  let selectedDestination;
  
  for (const locationItem of possibleDestinations) {
    if (locationItem.classList.contains('selected')) {
      selectedDestination = locationItem;
    }
  }
  return selectedDestination;
}

async function callTripData() {
  const selectedOrigin = userOrigin();
  const selectedDestination = userDestination();
  let originLatitude;
  let originLongitude;
  let destinationLatitude;
  let destinationLongitude;
  originLatitude = selectedOrigin.getAttribute('data-lat');
  originLongitude = selectedOrigin.getAttribute('data-long');
  destinationLatitude = selectedDestination.getAttribute('data-lat');
  destinationLongitude = selectedDestination.getAttribute('data-long');
  
  if (orgDestCheck(originLatitude, originLongitude, destinationLatitude, destinationLongitude)) {
    try {
      const tripData = await dataPath(originLatitude, originLongitude, destinationLatitude, destinationLongitude);
      const parsedData = tripdataparse(tripData);
      return tripRouteCheck(parsedData);
    } catch (error) {
      return console.log(error);
    }
  } else {
    recommenedContainer.textContent = 'Origin and Destination are the same: Please enter unique locations';
  }  
}

function tripdataparse(tripData) {
  let parsedTripData;
  
  parsedTripData = tripData.plans.map(plan => {
    return {
      number: plan.number,
      segments: segementDataParse(plan.segments),
    }
  });
  return parsedTripData;
}

function Undefinedplan(tripPlan) {
  if (tripPlan.to === undefined) {
    return false;
  } else {
    return true;
  }
}

function segementDataParse(segmentPlan) {
  let parsedSegments;
  
  parsedSegments = segmentPlan.map(segment => {
    if (segment.type === 'walk') {
      if (Undefinedplan(segment)) {
        return {
          type: segment.type,
          time: segment.times.durations.walking,
          stopNumber: propertyfeat(segment.to.stop, 'key', ''),
          stopName: propertyfeat(segment.to.stop, 'name', 'your destination'),
        }
      } else {
        return {
          type: segment.type,
          time: segment.times.durations.walking,
          stopNumber: '',
          stopName: 'your destination',
        }
      }  
    } else if (segment.type === 'ride') {
      return {
        type: segment.type,
        time: segment.times.durations.riding,
        routeNum: `Route ${segment.route.number}`,
        routeName: segment.route.name,
      }
    } else if (segment.type === 'transfer') {
      return {
        type: segment.type,
        fromStopNum: segment.from.stop.key,
        fromStopName: segment.from.stop.name,
        toStopNum: segment.to.stop.key,
        toStopName: segment.to.stop.name,
      }
    }
  })
  return parsedSegments;
}

function propertyfeat(property, propKey, message) {
  if (property === undefined) {
    return message;
  } else {
    return property[`${propKey}`];
  }
}

function routeName(routeObj) {
  if (routeObj.routeName === undefined) {
    return routeObj.routeNum;
  } else {
    return routeObj.routeName;
  }
}

const recommendedTripHeading = document.querySelector('.recommended');
const alternativeContainer = document.querySelector('.alternative-container');

function tripRouteCheck(tripDataArray) {
  let alternativeArray = tripDataArray.slice(1);
  let recommendedArray = tripDataArray.slice(0, 1);
  
  if (tripDataArray.length === 0) {
    recommenedContainer.textContent = 'Sorry, no options available';
  } else if (tripDataArray.length === 1) {
    Tripmlk(recommendedArray, recommendedTripHeading, recommenedContainer);
  } else {
    Tripmlk(recommendedArray, recommendedTripHeading, recommenedContainer);
    Tripmlk(alternativeArray, alternativeTripHeading, alternativeContainer);
  }
}


function orgDestCheck(originLat, originLon, destLat, destLon) {
  if (originLat === destLat && originLon === destLon) {
    return false;
  } else {
    return true;
  }
}

function tripList(tripSegment) {
  let listElement;
  
  if (tripSegment.type === 'walk') {
    if (tripSegment.stopNumber === '') {
      listElement = `<li><i class="fas fa-walking" aria-hidden="true">
      </i> Walk for ${tripSegment.time} minutes to ${tripSegment.stopName}.</li>`;
    } else {
      listElement = `<li><i class="fas fa-walking" aria-hidden="true">
      </i> Walk for ${tripSegment.time} minutes to stop #${tripSegment.stopNumber} - ${tripSegment.stopName}.</li>`;
    }
  } else if (tripSegment.type === 'ride') {
    listElement = `<li><i class="fas fa-bus" aria-hidden="true"></i> Ride the ${routeName(tripSegment)} for ${tripSegment.time} minutes.</li>`;
  } else if (tripSegment.type === 'transfer') {
    listElement = `<li><i class="fas fa-ticket-alt" aria-hidden="true"></i> Transfer from stop #${tripSegment.fromStopNum}
    - ${tripSegment.fromStopName} to stop #${tripSegment.toStopNum} - ${tripSegment.toStopName}.</li>`;
  }
  return listElement;
}

function combinedList(tripData) {
  let completeList = '';
  
  tripData.segments.forEach(item => {
    completeList += tripList(item)
  })
  return completeList;
}

function Tripmlk(tripData, heading, container) {
  heading.style.display = 'block';
  container.innerHTML = '';

  tripData.forEach(trip => {
    container.insertAdjacentHTML('beforeend', `<ul class="trip-list">${combinedList(trip)}</ul>`);
  }); 
}

function container() {
  recommendedTripHeading.style.display = 'none';
  alternativeTripHeading.style.display = 'none';
  recommenedContainer.innerHTML = '';
  alternativeContainer.innerHTML = '';
}

const originInputElem = document.querySelector('.origin-form input');
const originFormElem = document.querySelector('.origin-form');
const originsListElem = document.querySelector('.origins');

originFormElem.addEventListener('submit', event => {
  event.preventDefault();
  loactioninfo(originInputElem, originsListElem);
});


const destinationInputElem = document.querySelector('.destination-form input');
const destinationFormElem = document.querySelector('.destination-form');
const destinationsListElem = document.querySelector('.destinations');

destinationFormElem.addEventListener('submit', event => {
  event.preventDefault();
  loactioninfo(destinationInputElem, destinationsListElem);
});

originsListElem.addEventListener('click', event => {
  const clickedLocation = event.target.closest('.location');
  classChanges(clickedLocation, 'origins');  
});

destinationsListElem.addEventListener('click', event => {
  const clickedLocation = event.target.closest('.location');
  classChanges(clickedLocation, 'destinations');
});

const planTripButton = document.querySelector('.plan-trip');
planTripButton.addEventListener('click', () => {
  container();
  
  if (userSelection()) {
    callTripData();    
  }   
});