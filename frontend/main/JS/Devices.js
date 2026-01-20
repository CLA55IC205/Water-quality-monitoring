// ==============================
// DEVICE LIST (FROM BACKEND)
// ==============================

const showDevicesBtn = document.getElementById("showDevicesBtn");
const devicesList = document.getElementById("devicesList");

let devicesLoaded = false;

function getSelectedDeviceId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("device_id");
}


showDevicesBtn.addEventListener("click", async () => {

    // Toggle visibility
    if (devicesList.style.display === "none" || !devicesList.style.display) {
        devicesList.style.display = "block";
    } else {
        devicesList.style.display = "none";
        return;
    }

    // Prevent refetching every time
    if (devicesLoaded) return;

    try {
        const response = await fetch("http://localhost:8000/monitoring/list");
        if (!response.ok) throw new Error("Failed to fetch devices");

        const devices = await response.json();

        devicesList.innerHTML = ""; // Clear placeholder

        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div class="device-item">
                    <span class="device-name">No devices found</span>
                </div>
            `;
            return;
        }

        devices.forEach(device => {
            const div = document.createElement("div");
            div.className = "device-item";

            div.innerHTML = `
                <span class="device-name">${device.id}</span>
                <span class="device-status online">Active</span>
            `;

                div.style.cursor = "pointer";

                div.addEventListener("click", () => {
                    window.location.href = `${window.location.pathname}?device_id=${device.id}`;
                });


            devicesList.appendChild(div);
        });

        devicesLoaded = true;

    } catch (error) {
        console.error("Device fetch error:", error);
        devicesList.innerHTML = `
            <div class="device-item">
                <span class="device-name">Error loading devices</span>
            </div>
        `;
    }
});

const activeDeviceId = getSelectedDeviceId();

if (activeDeviceId) {
    fetch(`http://localhost:8000/monitoring_data/${activeDeviceId}`)
        .then(res => res.json())
        .then(data => {
            updatePhStatus(data.ph_value);
            updateHeatStatus(data.temperature);
            updateFilterStatus(data.tds_value);
        });
}

if (device.id === getSelectedDeviceId()) {
    div.style.background = "#eef4ff";
    div.style.borderRadius = "6px";
}
