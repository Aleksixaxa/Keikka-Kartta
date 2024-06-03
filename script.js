let darkmodeButton = document.querySelector('.dark-mode-button');
let darkModeEnabled = false;
let darkModeStyle;
let map;
let geocoder;
let markers = []; // Array to store markers
let infoWindows = []; // Store InfoWindow for each marker to manage them independently

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0},
        zoom: 2,
        styles: darkModeStyle // Apply the dark mode style here

    });
    geocoder = new google.maps.Geocoder();
}

function processAppointmentsJson(jsonString) {
    const appointments = JSON.parse(jsonString);
    clearMarkersAndInfoWindows();
    appointments.forEach(appointment => {
        geocodeAndCreateMarker(appointment.location, appointment.title, appointment.time);
    });
    updateLocationCount(appointments.length); // Update the count of locations
    updateAppointmentsPerStaff(); // Update the appointments per staff based on the current count
}

document.getElementById('staff-count').addEventListener('input', function() {
    updateAppointmentsPerStaff(); // Update whenever the input value changes
});

function updateLocationCount(count) {
    document.getElementById('location-count').textContent = count;
    document.title = `Keikka Kartta 1.0 | Keikkoja: ${count}` // make this work later
    updateAppointmentsPerStaff(); // Recalculate appointments per staff whenever the count updates
}

function updateAppointmentsPerStaff() {
    const staffCount = parseInt(document.getElementById('staff-count').value, 10); // Get the current number of staff from input
    const totalAppointments = parseInt(document.getElementById('location-count').textContent, 10); // Get the current total appointments
    const appointmentsPerStaff = staffCount ? Math.ceil(totalAppointments / staffCount) : 0; // Calculate appointments per staff, avoid division by zero
    document.getElementById('appointments-per-staff').textContent = appointmentsPerStaff; // Display the result
}

document.getElementById('staff-count').addEventListener('input', updateAppointmentsPerStaff); // Update calculation on input change


function clearMarkersAndInfoWindows() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    infoWindows.forEach(infoWindow => infoWindow.close());
    infoWindows = [];
}
function getMarkerColor(title) {
    title = title.toLowerCase();
    if (title.includes('palke')) {
        return '#FFFF00'; // Yellow
    } else if (title.includes('jta-projekti')) {
        return '#0000FF'; // Blue
    } else {
        return '#FF0000'; // Red (default)
    }
}


//regular marker code:
// if (status === 'OK') {
//     const marker = new google.maps.Marker({
//         map: map,
//         position: results[0].geometry.location,
//         icon: null // Start with the default icon
//     });
//     markers.push(marker);
function geocodeAndCreateMarker(location, title, time) {
    geocoder.geocode({ 'address': location }, (results, status) => {
               if (status === 'OK') {
            const markerColor = getMarkerColor(title);
            const originalIcon = {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: markerColor,
                fillOpacity: 0.8,
                strokeColor: 'white',
                strokeWeight: 2,
                scale: 5   // Size of the marker
            };

            const marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                icon: originalIcon
            });
            marker.originalIcon = originalIcon; // Store the original icon
            markers.push(marker);


            const infoWindow = new google.maps.InfoWindow({
                content: `<strong>${title}</strong><br>${location}<br>Time: ${time}`
            });
            infoWindows.push(infoWindow);

            const listItem = document.createElement('li');
            listItem.textContent = location;
            listItem.style.cursor = 'pointer';
            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';
            listItem.style.justifyContent = 'space-between';
            listItem.dataset.index = markers.length - 1; // Save index for reference

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.style.marginLeft = '10px';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent li click event
                removeLocation(marker, listItem);
            });

            listItem.appendChild(removeBtn);
            document.getElementById('locations-list').appendChild(listItem);

            // Toggle appearance based on interaction with the list item or marker
            function toggleAppearance(isActive) {
                if (isActive) {
                    infoWindow.open(map, marker);
                    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
                    listItem.style.backgroundColor = 'green';
                } else {
                    infoWindow.close();
                    marker.setIcon(null);
                    listItem.style.backgroundColor = '';
                }
            }

            // Marker click opens the infoWindow and changes the icon and list item background
            marker.addListener('click', () => {
                toggleAppearance(!infoWindow.getMap());
            });

            // List item click triggers the marker click behavior
            listItem.addEventListener('click', () => {
                toggleAppearance(!infoWindow.getMap());
            });

            google.maps.event.addListener(infoWindow, 'closeclick', () => {
                toggleAppearance(false);
            });

            // Update the count of locations each time a marker is successfully added
            updateLocationCount(markers.length);
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
        }
    });
}


function updateLocationCount(count) {
    document.getElementById('location-count').textContent = count;
    updateAppointmentsPerStaff(); // Recalculate appointments per staff whenever the count updates
}

function removeLocation(marker, listItem) {
    const markerIndex = markers.indexOf(marker);
    if (markerIndex !== -1) {
        markers[markerIndex].setMap(null);
        markers.splice(markerIndex, 1);
        infoWindows[markerIndex].close();
        infoWindows.splice(markerIndex, 1);
        listItem.remove();
    }
    // Update the location count after removal
    updateLocationCount(markers.length);
}


function clearMarkersAndInfoWindows() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    infoWindows.forEach(infoWindow => infoWindow.close());
    infoWindows = [];
}


//bulk removal


// start jouurney button
function startJourney() {
    // Starting and ending point for the journey
    const startPoint = 'Ruosilantie 14, Helsinki, Finland';
    let waypoints = [];

    // Collect all highlighted (selected) locations
    document.querySelectorAll('#locations-list li').forEach(li => {
        if (li.style.backgroundColor === 'green') { // Assuming green background indicates selection
            // Extract only the location text and not the 'Remove' button text
            const textContent = li.childNodes[0].textContent.trim();  // Assumes that the location name is the first text node of the list item
            waypoints.push(textContent);
        }
    });

    // Build the Google Maps directions URL
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startPoint)}&destination=${encodeURIComponent(startPoint)}`;

    if (waypoints.length > 0) {
        // Add waypoints to the URL
        mapsUrl += `&waypoints=${waypoints.map(encodeURIComponent).join('|')}`;
    }

    // Open the URL in a new tab
    window.open(mapsUrl, '_blank');
}

// copy to clipboard current locations
function copySelectedLocations() {
    let selectedLocations = [];
    document.querySelectorAll('#locations-list li').forEach(li => {
        if (li.style.backgroundColor === 'green') {
            const locationText = li.childNodes[0].textContent.trim(); // Assuming location name is the first text node
            selectedLocations.push(locationText);
        }
    });

    if (selectedLocations.length > 0) {
        const locationsString = selectedLocations.join('\n'); // Join all locations with a newline character
        navigator.clipboard.writeText(locationsString).then(() => {
            alert('Selected locations copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy locations: ', err);
        });
    } else {
        alert('No locations selected.');
    }
}

//* Dark mode

const darkModeFunc = () => {
    if(darkModeEnabled) {
        darkModeStyle = darkModeStyleFile
        initMap()
    } else {
        darkModeStyle = "";
        initMap()
    }
}

darkmodeButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (darkModeEnabled) {
        darkModeFunc();
        darkModeEnabled = false;
    } else {
        darkModeFunc();
        darkModeEnabled = true;
    }

})

var darkModeStyleFile = [

        {
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#1d2c4d"
            }
          ]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#8ec3b9"
            }
          ]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#1a3646"
            }
          ]
        },
        {
          "featureType": "administrative.country",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#4b6878"
            }
          ]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#64779e"
            }
          ]
        },
        {
          "featureType": "administrative.province",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#4b6878"
            }
          ]
        },
        {
          "featureType": "landscape.man_made",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#334e87"
            }
          ]
        },
        {
          "featureType": "landscape.natural",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#023e58"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#283d6a"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#6f9ba5"
            }
          ]
        },
        {
          "featureType": "poi",
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#1d2c4d"
            }
          ]
        },
        {
          "featureType": "poi.business",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "geometry.fill",
          "stylers": [
            {
              "color": "#023e58"
            }
          ]
        },
        {
          "featureType": "poi.park",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#3C7680"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#304a7d"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#98a5be"
            }
          ]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#1d2c4d"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#2c6675"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "geometry.stroke",
          "stylers": [
            {
              "color": "#255763"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#b0d5ce"
            }
          ]
        },
        {
          "featureType": "road.highway",
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#023e58"
            }
          ]
        },
        {
          "featureType": "transit",
          "stylers": [
            {
              "visibility": "off"
            }
          ]
        },
        {
          "featureType": "transit",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#98a5be"
            }
          ]
        },
        {
          "featureType": "transit",
          "elementType": "labels.text.stroke",
          "stylers": [
            {
              "color": "#1d2c4d"
            }
          ]
        },
        {
          "featureType": "transit.line",
          "elementType": "geometry.fill",
          "stylers": [
            {
              "color": "#283d6a"
            }
          ]
        },
        {
          "featureType": "transit.station",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#3a4762"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [
            {
              "color": "#0e1626"
            }
          ]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [
            {
              "color": "#4e6d70"
            }
          ]
        }
    
];

