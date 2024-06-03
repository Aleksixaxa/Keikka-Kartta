let map;
let geocoder;
let markers = []; // Array to store markers
let infoWindows = []; // Store InfoWindow for each marker to manage them independently

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0}, // Center of the map. Adjust as necessary.
        zoom: 2 // Zoom out to see all markers. Adjust zoom level as necessary.
    });
    geocoder = new google.maps.Geocoder();
}

function geocodeAddresses() {
    const addresses = document.getElementById('address-input').value.split('\n');
    document.getElementById('locations-list').innerHTML = ''; // Clear existing list items
    markers.forEach(marker => marker.setMap(null)); // Remove all markers
    markers = []; // Reset the markers array
    infoWindows.forEach(infoWindow => infoWindow.close()); // Close existing InfoWindows
    infoWindows = []; // Reset InfoWindows

    let geocodePromises = addresses.map((address, index) => {
        return new Promise((resolve, reject) => {
            geocoder.geocode({'address': address}, function(results, status) {
                if (status === 'OK') {
                    resolve({
                        location: results[0].geometry.location,
                        address: address,
                        id: 'location-' + index // Unique ID for each location
                    });
                } else {
                    reject('Geocode was not successful for the following reason: ' + status);
                }
            });
        });
    });

    Promise.all(geocodePromises)
        .then(locations => {
            locations.forEach((loc, index) => {
                const marker = new google.maps.Marker({
                    map: map,
                    position: loc.location
                });
                markers.push(marker); // Store the marker

                const mapsLink = `<a href="https://www.google.com/maps/search/?api=1&query=${loc.location.lat()},${loc.location.lng()}" target="_blank">Open in Google Maps</a>`;
                const contentString = `${loc.address}<br>${mapsLink}`;

                const infoWindow = new google.maps.InfoWindow({
                    content: contentString
                });
                
                // Listen for the InfoWindow being closed via its close button
                google.maps.event.addListener(infoWindow, 'closeclick', (function(listItemId) {
                    return function() {
                        const listItem = document.getElementById(listItemId);
                        if (listItem) {
                            listItem.style.backgroundColor = ''; // Remove the highlight
                        }
                    };
                })(loc.id));
                
                infoWindows.push(infoWindow); // Store the InfoWindow

                marker.addListener('click', () => {
                    infoWindow.open(map, marker); // Open the InfoWindow for the clicked marker

                    // Highlight the corresponding list item
                    const listItem = document.getElementById(loc.id);
                    listItem.style.backgroundColor = 'green'; // Apply highlight effect
                });

                // Add location name to the list with a click handler to remove it
                const listItem = document.createElement('li');
                listItem.id = loc.id; // Assign the unique ID
                listItem.textContent = loc.address;
                listItem.style.cursor = "pointer";
                listItem.addEventListener('click', function() {
                    marker.setMap(null); // Remove the marker from the map
                    markers = markers.filter(m => m !== marker); // Remove the marker from the array
                    infoWindow.close(); // Close the InfoWindow
                    listItem.remove(); // Remove the list item
                });
                document.getElementById('locations-list').appendChild(listItem);
            });
        })
        .catch(error => {
            document.getElementById('error-message').innerHTML = error;
        });
}

// start jouurney button
function startJourney() {
    // Starting and ending point for the journey
    const startPoint = 'Ruosilantie 14, Helsinki, Finland';
    let waypoints = [];

    // Collect all highlighted (selected) locations
    document.querySelectorAll('#locations-list li').forEach(li => {
        if (li.style.backgroundColor === 'green') { // Assuming green background indicates selection
            waypoints.push(li.textContent.trim());
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
