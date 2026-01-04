// Initialize Leaflet map
var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Single reusable marker
var marker = L.marker([51.505, -0.09]).addTo(map);

marker.bindPopup("Water body location").openPopup();


document.getElementById('updateLocation').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);

    // Validate inputs
    if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid latitude and longitude values.");
        return;
    }

    // Update map view
    map.setView([lat, lng], 15);

    // Move existing marker
    marker.setLatLng([lat, lng]);

    // Update popup content
    marker.bindPopup(
        `<b>Water Body Location</b><br>Lat: ${lat}<br>Lng: ${lng}`
    ).openPopup();

    map.flyTo([lat, lng], 15);
});


