// ----------------------------
// CONFIG
// ----------------------------
const deviceId = "ESP32_001"; // Change if needed
const defaultCoords = { lat: 51.505, lng: -0.09 }; // fallback if no backend data

// ----------------------------
// HELPER FUNCTIONS: Backend Calls
// ----------------------------
async function loadLocationFromBackend(deviceId) {
    try {
        const res = await fetch(`http://localhost:8000/waterbody/${deviceId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.error("Failed to fetch water body location:", err);
        return null;
    }
}

async function saveLocationToBackend(deviceId, lat, lng) {
    try {
        const res = await fetch(
            `http://localhost:8000/waterbody/location?device_id=${deviceId}&latitude=${lat}&longitude=${lng}`,
            { method: "POST" }
        );
        if (!res.ok) throw new Error("Failed to save location");
        return await res.json();
    } catch (err) {
        console.error(err);
        alert("Failed to save location to backend");
    }
}

// ----------------------------
// INITIALIZE MAP
// ----------------------------
let map, marker;

async function initMap() {
    // Load last saved location from backend
    const saved = await loadLocationFromBackend(deviceId);
    const lat = saved?.latitude ?? defaultCoords.lat;
    const lng = saved?.longitude ?? defaultCoords.lng;

    // Set input fields
    document.getElementById('latInput').value = lat;
    document.getElementById('lngInput').value = lng;

    // Initialize Leaflet map
    map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Single reusable marker
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(`<b>Water Body Location</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
}

// ----------------------------
// REINIT MAP FUNCTION (for later use)

let mapLocation, markerLocation;

async function initLocationMap() {
    // Load last saved location from backend
    const saved = await loadLocationFromBackend(deviceId);
    const lat = saved?.latitude ?? defaultCoords.lat;
    const lng = saved?.longitude ?? defaultCoords.lng;

    // Set input fields
    document.getElementById('latInput').value = lat;
    document.getElementById('lngInput').value = lng;

    // Initialize Leaflet map
    mapLocation = L.map('mapLocation').setView([lat, lng], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapLocation);
    // Single reusable marker
    markerLocation = L.marker([lat, lng]).addTo(mapLocation);
    markerLocation.bindPopup(`<b>Water Body Location</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
}


// ----------------------------
// HANDLE UPDATE LOCATION
// ----------------------------
document.getElementById('updateLocation').addEventListener('click', async () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid latitude and longitude values.");
        return;
    }

    // Update marker on map
    marker.setLatLng([lat, lng]);
    marker.bindPopup(`<b>Water Body Location</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
    map.flyTo([lat, lng], 15);

    // Update marker on map
    markerLocation.setLatLng([lat, lng]);
    markerLocation.bindPopup(`<b>Water Body Location</b><br>Lat: ${lat}<br>Lng: ${lng}`).openPopup();
    mapLocation.flyTo([lat, lng], 15);

    // Save to backend
    await saveLocationToBackend(deviceId, lat, lng);
});



// Initialize map on page load
window.addEventListener('load', initLocationMap);
window.addEventListener('load', initMap);
// ----------------------------




