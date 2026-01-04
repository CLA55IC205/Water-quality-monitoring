// ==============================
// GLOBAL SENSOR VALUES
// ==============================
let phValue = 7.0;
let tempValue = 33;
let tdsValue = 300;

// ==============================
// DOM ELEMENTS
// ==============================
const filterIcon = document.getElementById("filterStatusIcon");
const heatStatusIcon = document.getElementById("heatStatusIcon");
const phStatusIcon = document.getElementById("phStatusIcon");
const notificationList = document.getElementById("notificationList");

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
        addNotification("pH Level Alert", `pH is ${val}`);
    }
}

function updateHeatStatus(val) {
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
        addNotification("High Temperature", `Temperature is ${val}°C`);
    }
}

function updateFilterStatus(val) {
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
        addNotification("High TDS Warning", `TDS is ${val} ppm`);
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
    phChart = createSensorChart("phChart", 7, 5, 8, "#3498db");
    tempChart = createSensorChart("tempChart", 25, 15, 40, "#e74c3c");
    tdsChart = createSensorChart("tdsChart", 300, 0, 1500, "#2ecc71");

    setInterval(fetchLatestData, 5000);
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
