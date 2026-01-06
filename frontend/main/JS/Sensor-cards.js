// ==============================
// GLOBAL SENSOR VALUES
// ==============================
let phValue = 0;
let tempValue = 0;
let tdsValue = 0;

let phAlertActive = false;
let tempAlertActive = false;
let tdsAlertActive = false;


// ==============================
// DOM ELEMENTS
// ==============================
const filterIcon = document.getElementById("filterStatusIcon");
const heatStatusIcon = document.getElementById("heatStatusIcon");
const phStatusIcon = document.getElementById("phStatusIcon");
const notificationList = document.getElementById("notificationList");

const phValueDisplay = document.getElementById("phValueDisplay");
const tempValueDisplay = document.getElementById("tempValueDisplay");
const tdsValueDisplay = document.getElementById("tdsValueDisplay");


// ==============================
// NOTIFICATIONS (single source)
// ==============================
function addNotification(title, message) {
    if (!notificationList) return;

    const item = document.createElement("div");
    item.className = "notification-item";

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    item.innerHTML = `
        <strong>${title}</strong>
        <p>${message}</p>
        <small>${timeString}</small>
    `;

    notificationList.prepend(item);
    playNotificationSound();
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log("Audio not supported");
    }
}

// ==============================
// STATUS ICON UPDATERS
// ==============================
function updatePhStatus(val) {

    phAlertActive = false;

    phStatusIcon.className = "filter-icon";

    if (val >= 6.5 && val <= 7.5) {
        phStatusIcon.textContent = "🍃";
        phStatusIcon.classList.add("optimal");
    } else if (val > 7.5 && val <= 8.0) {
        phStatusIcon.textContent = "⚠️";
        phStatusIcon.classList.add("moderate");
    } else {
    phStatusIcon.textContent = "🚨";
    phStatusIcon.classList.add("warning");

        if (!phAlertActive) {
            addNotification("pH Level Alert", `pH is ${val}`);
            phAlertActive = true;
        }
    }
}

function updateHeatStatus(val) {

    tempAlertActive = false;

    heatStatusIcon.className = "filter-icon";

    if (val <= 25) {
        heatStatusIcon.textContent = "🍃";
        heatStatusIcon.classList.add("optimal");
    } else if (val <= 30) {
        heatStatusIcon.textContent = "⚠️";
        heatStatusIcon.classList.add("moderate");
    } else {
    heatStatusIcon.textContent = "🚨";
    heatStatusIcon.classList.add("warning");

        if (!tempAlertActive) {
            addNotification("High Temperature", `Temperature is ${val}°C`);
            tempAlertActive = true;
        }
    }
}

function updateFilterStatus(val) {

    tdsAlertActive = false;

    filterIcon.className = "filter-icon";

    if (val <= 700) {
        filterIcon.textContent = "🍃";
        filterIcon.classList.add("optimal");
    } else if (val <= 1000) {
        filterIcon.textContent = "⚠️";
        filterIcon.classList.add("moderate");
    } else {
    filterIcon.textContent = "🚨";
    filterIcon.classList.add("warning");

        if (!tdsAlertActive) {
            addNotification("High TDS Warning", `TDS is ${val} ppm`);
            tdsAlertActive = true;
        }
    }
}

// ==============================
// CHART HELPERS
// ==============================
function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);

    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function createSensorChart(canvasId, value, min, max, color) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    const percentage = Math.min(
        100,
        Math.max(0, ((value - min) / (max - min)) * 100)
    );

    const gradient = ctx.createLinearGradient(0, 0, 0, 130);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, lightenColor(color, 40));

    return new Chart(ctx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [gradient, "#e8edf0"],
                borderWidth: 0,
                cutout: "75%",
                borderRadius: 6
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            animation: { duration: 1200 }
        }
    });
}

function updateSensorChart(chart, value, min, max) {
    const percentage = Math.min(
        100,
        Math.max(0, ((value - min) / (max - min)) * 100)
    );

    chart.data.datasets[0].data = [percentage, 100 - percentage];
    chart.update();
}

// ==============================
// GLOBAL CHART REFERENCES
// ==============================
let phChart, tempChart, tdsChart;

// ==============================
// BACKEND FETCH
// ==============================
async function fetchLatestData() {
    try {
        const res = await fetch("http://localhost:8000/monitoring_data/latest");
        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();

        phValue = data.ph_value;
        tempValue = data.temperature;
        tdsValue = data.tds_value;

        if (data.ph_value == null || data.temperature == null || data.tds_value == null) {
            throw new Error("Invalid backend response");
        }


        phValueDisplay.textContent = phValue.toFixed(2);
        tempValueDisplay.textContent = tempValue;
        tdsValueDisplay.textContent = tdsValue;


        updatePhStatus(phValue);
        updateHeatStatus(tempValue);
        updateFilterStatus(tdsValue);

        updateSensorChart(phChart, phValue, 5.0, 8.0);
        updateSensorChart(tempChart, tempValue, 15, 40);
        updateSensorChart(tdsChart, tdsValue, 0, 1500);

    } catch (err) {
        console.error("Backend error:", err);
    }
}

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    phChart = createSensorChart("phChart", 0, 5, 8, "#3498db");
    tempChart = createSensorChart("tempChart", 0, 15, 40, "#e74c3c");
    tdsChart = createSensorChart("tdsChart", 0, 0, 1500, "#2ecc71");

    setInterval(fetchLatestData, 1000); // Every 30 seconds
    fetchLatestData();
});

// ==============================
// SIDEBAR
// ==============================
const toggle = document.getElementById("sidebarToggle");
const overlay = document.getElementById("sidebarOverlay");

toggle?.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
});

overlay?.addEventListener("click", () => {
    document.body.classList.remove("sidebar-open");
});

// ==============================
// 24H CHANGE & STABILITY UPDATES
// ==============================

async function fetchAllDeviceIds() {
    try {
        const res = await fetch("http://localhost:8000/monitoring/list");
        if (!res.ok) throw new Error("Failed to fetch device list");

        const devices = await res.json(); // [{id: "device_001"}, ...]
        return devices.map(d => d.id);    // ["device_001", "device_002", ...]
    } catch (err) {
        console.error("Error fetching device IDs:", err);
        return [];
    }
}

async function updateAllDevices24hChange() {
    const deviceIds = await fetchAllDeviceIds(); // get all device IDs
    deviceIds.forEach(id => update24hTemperatureChange(id));
}

// Call every 1 second
setInterval(updateAllDevices24hChange, 1000);

// Initial call on page load
updateAllDevices24hChange();

async function update24hTemperatureChange(deviceId) {
    try {
        const res = await fetch(`http://localhost:8000/history/${deviceId}`);
        if (!res.ok) throw new Error(`Failed to fetch history for ${deviceId}`);

        const data = await res.json();
        if (data.length < 2) return; // Not enough data

        const now = new Date();
        const past24h = new Date(now.getTime() - 24*60*60*1000);

        let closest = data[0];
        for (let i = 0; i < data.length; i++) {
            const ts = new Date(data[i].timestamp);
            if (Math.abs(ts - past24h) < Math.abs(new Date(closest.timestamp) - past24h)) {
                closest = data[i];
            }
        }

        const latestTemp = data[data.length-1].temperature;
        const pastTemp = closest.temperature;

        const diff = (latestTemp - pastTemp).toFixed(1);
        const sign = diff >= 0 ? "+" : "";

        // Dynamic span ID based on device ID
        const tempChangeElement = document.getElementById(`tempChangeValue-${deviceId}`);
        if (tempChangeElement) {
            tempChangeElement.textContent = `${sign}${diff}°C`;
        }

    } catch (err) {
        console.error(`Error updating 24h change for ${deviceId}:`, err);
    }
}

// ==============================
// STABILITY UPDATES
// ==============================

async function updateStability(deviceId) {
    try {
        const res = await fetch(`http://localhost:8000/history/${deviceId}`);
        if (!res.ok) throw new Error(`Failed to fetch history for ${deviceId}`);

        const data = await res.json();
        if (data.length < 2) return;

        const latest = data[data.length - 1];
        const past24hTime = new Date(new Date().getTime() - 24*60*60*1000);

        // Find reading closest to 24h ago
        let closest = data[0];
        for (let r of data) {
            const ts = new Date(r.timestamp);
            if (Math.abs(ts - past24hTime) < Math.abs(new Date(closest.timestamp) - past24hTime)) {
                closest = r;
            }
        }

        // Calculate relative change for pH, temperature, or TDS
        const stability = {
            ph: Math.max(0, 100 - Math.abs(latest.ph_value - closest.ph_value) * 20), // scale to % (example)
            temp: Math.max(0, 100 - Math.abs(latest.temperature - closest.temperature) * 10),
            tds: Math.max(0, 100 - Math.abs(latest.tds_value - closest.tds_value) * 0.2)
        };

        // Update the element (example: showing temperature stability)
        const stabilityElement = document.getElementById(`stabilityValue-${deviceId}`);
        if (stabilityElement) {
            stabilityElement.textContent = `${Math.round(stability.temp)}%`;
        }

    } catch (err) {
        console.error(`Error updating stability for ${deviceId}:`, err);
    }
}

async function updateAllDevicesStability() {
    const deviceIds = await fetchAllDeviceIds();
    deviceIds.forEach(id => updateStability(id));
}

// Call every 1 second
setInterval(updateAllDevicesStability, 1000);
updateAllDevicesStability();


// ==============================
// TDS CHANGE RATE UPDATES
// ==============================

async function updateTDSChangeRate(deviceId) {
    try {
        const res = await fetch(`http://localhost:8000/history/${deviceId}`);
        if (!res.ok) throw new Error(`Failed to fetch history for ${deviceId}`);

        const data = await res.json();
        if (data.length < 2) return; // Not enough data

        const now = new Date();
        const past24h = new Date(now.getTime() - 24*60*60*1000);

        // Find reading closest to 24h ago
        let closest = data[0];
        for (let r of data) {
            const ts = new Date(r.timestamp);
            if (Math.abs(ts - past24h) < Math.abs(new Date(closest.timestamp) - past24h)) {
                closest = r;
            }
        }

        const latestTDS = data[data.length-1].tds_value;
        const pastTDS = closest.tds_value;

        // Change rate in ppm/day
        const diff = (latestTDS - pastTDS).toFixed(1);
        const sign = diff >= 0 ? "+" : "";

        // Update the element
        const tdsChangeElement = document.getElementById(`tdsChangeRate-${deviceId}`);
        if (tdsChangeElement) {
            tdsChangeElement.textContent = `${sign}${diff} ppm/day`;
        }

    } catch (err) {
        console.error(`Error updating TDS change rate for ${deviceId}:`, err);
    }
}

async function updateAllDevicesTDSChangeRate() {
    const deviceIds = await fetchAllDeviceIds();
    deviceIds.forEach(id => updateTDSChangeRate(id));
}

// Update every 1 second
setInterval(updateAllDevicesTDSChangeRate, 1000);
updateAllDevicesTDSChangeRate();


// ==============================
// IDEAL RANGE SETTINGS
// ==============================
// Grab input elements
const phInput = document.getElementById("phRangeInput");
const tempInput = document.getElementById("tempRangeInput");
const tdsInput = document.getElementById("tdsRangeInput");

// Grab spans on cards
const phCardSpan = document.getElementById("phIdealRange");
const tempCardSpan = document.getElementById("tempIdealRange");
const tdsCardSpan = document.getElementById("tdsIdealRange");

// Update button
const updateRangesBtn = document.getElementById("updateRangesBtn");

updateRangesBtn.addEventListener("click", () => {
    // PH sensor – leave as-is
    if (phInput.value.trim()) {
        phCardSpan.textContent = phInput.value.trim();
        localStorage.setItem("phRange", phInput.value.trim());
    }

    // Temperature sensor – append °C
    if (tempInput.value.trim()) {
        tempCardSpan.textContent = `${tempInput.value.trim()}°C`;
        localStorage.setItem("tempRange", tempInput.value.trim());
    }

    // TDS sensor – append ppm
    if (tdsInput.value.trim()) {
        tdsCardSpan.textContent = `${tdsInput.value.trim()} ppm`;
        localStorage.setItem("tdsRange", tdsInput.value.trim());
    }
});


// Load saved ranges on page load
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("phRange")) phCardSpan.textContent = localStorage.getItem("phRange");
    if (localStorage.getItem("tempRange")) tempCardSpan.textContent = `${localStorage.getItem("tempRange")}°C`;
    if (localStorage.getItem("tdsRange")) tdsCardSpan.textContent = `${localStorage.getItem("tdsRange")} ppm`;
});

