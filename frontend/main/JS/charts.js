let temperatureChart = null;

/* ---------------------------
   Fetch latest active device
---------------------------- */
async function getLatestActiveDevice() {
    const res = await fetch("http://localhost:8000/data/latest");
    if (!res.ok) throw new Error("Failed to fetch latest data");

    const data = await res.json();
    if (!data.length) throw new Error("No devices found");

    return data[data.length - 1].device_id;
}

/* ---------------------------
   Load temperature chart
---------------------------- */
async function loadTemperatureChart(deviceId) {
    try {
        const today = new Date().toISOString().split("T")[0];

        const res = await fetch(
            `http://localhost:8000/monitoring_data/${deviceId}/chart?date=${today}`
        );
        if (!res.ok) throw new Error("Failed to fetch chart data");

        const data = await res.json();

        const labels = data.timeLabels;
        const temperatures = data.temperatureValues;

        const ctx = document.getElementById("lineChart").getContext("2d");

        if (temperatureChart) {
            temperatureChart.destroy();
        }

        temperatureChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Temperature (°C)",
                    data: temperatures,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    tension: 0.35,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10,
                            maxRotation: 0
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Temperature (°C)"
                        },
                        ticks: {
                            callback: value => `${value}°C`
                        }
                    }
                },

                plugins: {
                    legend: {
                        labels: {
                            color: "#e5e7eb"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.parsed.y} °C`
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error("Temperature chart error:", err);
    }
}

/* ---------------------------
   Auto refresh logic
---------------------------- */
async function refreshChart() {
    try {
        const deviceId = await getLatestActiveDevice();
        await loadTemperatureChart(deviceId);
    } catch (err) {
        console.error("Chart refresh failed:", err);
    }
}

// Initial load + live updates
refreshChart();
setInterval(refreshChart, 5_000);
// Refresh every 5 seconds
