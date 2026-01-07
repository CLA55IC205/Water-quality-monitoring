// Chart instances
let temperatureChart = null;


/* ---------------------------
   Configuration & Constants
---------------------------- */
const CONFIG = {
    API_BASE_URL: "http://localhost:8000",
    REFRESH_INTERVAL: 10000, // 30 seconds
    CHART_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                    maxRotation: 0
                },
                grid: { display: false }
            }
        },
        plugins: {
            legend: {
                labels: { color: "#0228728a" }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    modifierKey: 'shift'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                    onZoomComplete: function({ chart }) {
                        console.log('Zoom completed');
                    }
                },
                limits: {
                    x: { min: 'original', max: 'original' }
                }
            }
        }
    }
};

const CHART_CONFIGS = {
    temperature: {
        elementId: "lineChart",
        dataKey: "temperatureValues",
        label: "Temperature (°C)",
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        yAxisConfig: {
            title: { display: true, text: "Temperature (°C)" },
            ticks: { callback: value => `${value}°C` }
        },
        tooltip: { callback: ctx => ` ${ctx.parsed.y} °C` }
    },
    ph: {
        elementId: "phLineChart",
        dataKey: "phValues",
        label: "pH Level",
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        yAxisConfig: {
            min: 0,
            max: 14,
            title: { display: true, text: "pH" }
        }
    },
    tds: {
        elementId: "tdsLineChart",
        dataKey: "tdsValues",
        label: "TDS (ppm)",
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.15)",
        yAxisConfig: {
            title: { display: true, text: "TDS (ppm)" },
            ticks: { callback: v => `${v} ppm` }
        }
    }
};

/* ---------------------------
   API Service
---------------------------- */
class ApiService {
    static async fetchLatestDevice() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/data/latest`);
        if (!response.ok) throw new Error("Failed to fetch latest data");
        
        const data = await response.json();
        if (!data.length) throw new Error("No devices found");
        
        return data[data.length - 1].device_id;
    }

    static async fetchChartData(deviceId, date) {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/monitoring_data/${deviceId}/chart?date=${date}`
        );
        if (!response.ok) throw new Error("Failed to fetch chart data");
        
        return response.json();
    }
}

/* ---------------------------
   Zoom Controls UI
---------------------------- */
class ZoomControls {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.controlsAdded = new Set();
    }

    createControlsForChart(chartType, chartInstance) {
        const chartElement = document.getElementById(CHART_CONFIGS[chartType].elementId);
        if (!chartElement || this.controlsAdded.has(chartType)) return;

        const controlsContainer = document.createElement('div');

        // Add container after the canvas
        const parent = chartElement.parentElement;
        parent.style.position = 'relative';
        parent.appendChild(controlsContainer);

        this.controlsAdded.add(chartType);

        // Add keyboard shortcuts
        this.addKeyboardShortcuts(chartInstance, chartType);
    }



    zoomChart(chart, factor) {
        if (chart && chart.options.plugins.zoom.zoom.wheel.enabled) {
            const { min, max } = chart.scales.x;
            const range = max - min;
            const center = (min + max) / 2;
            const newRange = range * factor;
            
            chart.zoomScale('x', {
                min: center - newRange / 2,
                max: center + newRange / 2
            });
        }
    }

    resetZoom(chart) {
        if (chart) {
            chart.resetZoom();
            // Also reset pan
            if (chart.scales.x.options.min !== undefined) {
                delete chart.scales.x.options.min;
                delete chart.scales.x.options.max;
            }
            chart.update();
        }
    }

    togglePan(chart) {
        if (chart) {
            const panEnabled = chart.options.plugins.zoom.pan.enabled;
            chart.options.plugins.zoom.pan.enabled = !panEnabled;
            
            // Update cursor
            const canvas = chart.canvas;
            canvas.style.cursor = !panEnabled ? 'grab' : 'default';
            
            // Show notification
            this.showNotification(!panEnabled ? 'Pan mode enabled (Shift + Drag)' : 'Pan mode disabled');
        }
    }

    addKeyboardShortcuts(chartInstance, chartType) {
        const handleKeyDown = (e) => {
            const activeElement = document.activeElement;
            const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
            
            if (isInput) return;

            switch(e.key) {
                case '+':
                case '=':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomChart(chartInstance, 0.9);
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.zoomChart(chartInstance, 1.1);
                    }
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetZoom(chartInstance);
                    }
                    break;
                case 'p':
                case 'P':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.togglePan(chartInstance);
                    }
                    break;
            }
        };

        // Store the handler so we can remove it later if needed
        chartInstance._keyboardHandler = handleKeyDown;
        document.addEventListener('keydown', handleKeyDown);
    }

  

    cleanup() {
        this.controlsAdded.clear();
        // Remove keyboard event listeners
        document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.chart && canvas.chart._keyboardHandler) {
                document.removeEventListener('keydown', canvas.chart._keyboardHandler);
            }
        });
    }
}

/* ---------------------------
   Chart Manager
---------------------------- */
class ChartManager {
    constructor() {
        this.charts = {
            temperature: temperatureChart,
            ph: phChart,
            tds: tdsChart
        };
        this.zoomControls = new ZoomControls(this);
    }

    destroyChart(chartType) {
        if (this.charts[chartType]) {
            // Clean up keyboard events
            if (this.charts[chartType]._keyboardHandler) {
                document.removeEventListener('keydown', this.charts[chartType]._keyboardHandler);
            }
            
            this.charts[chartType].destroy();
            this.charts[chartType] = null;
        }
    }

    createChart(chartType, labels, data) {
        const config = CHART_CONFIGS[chartType];
        const ctx = document.getElementById(config.elementId).getContext("2d");

        // Destroy existing chart
        this.destroyChart(chartType);

        // Create chart configuration
        const chartOptions = {
            ...JSON.parse(JSON.stringify(CONFIG.CHART_OPTIONS)), // Deep clone
            scales: {
                x: CONFIG.CHART_OPTIONS.scales.x,
                y: {
                    ...config.yAxisConfig,
                    ...CONFIG.CHART_OPTIONS.scales?.y
                }

                
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'index',
                intersect: false
            },

            // DISABLE ALL ANIMATIONS
          animation: false,
        // Also disable transitions
        transitions: {
            active: {
                animation: { duration: 0 }
            }
        }
        };

        // Add tooltip callback if configured
        if (config.tooltip) {
            chartOptions.plugins.tooltip = {
                callbacks: {
                    label: config.tooltip.callback
                }
            };
        }

        // Create and store new chart
        this.charts[chartType] = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: config.label,
                    data,
                    borderColor: config.borderColor,
                    backgroundColor: config.backgroundColor,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointHitRadius: 10
                }]
            },
            options: chartOptions
        });

        // Initialize zoom plugin
        this.initializeZoom(this.charts[chartType]);

        // Add zoom controls
        setTimeout(() => {
            this.zoomControls.createControlsForChart(chartType, this.charts[chartType]);
        }, 100);

        return this.charts[chartType];
    }

    initializeZoom(chart) {
        // Ensure zoom plugin is registered
        if (typeof Chart.register === 'function') {
            try {
                Chart.register(require('chartjs-plugin-zoom'));
            } catch (e) {
                console.log('Zoom plugin already registered or not available');
            }
        }

        // Add double-click to reset zoom
        chart.canvas.ondblclick = () => {
            this.zoomControls.resetZoom(chart);
        };

        // Change cursor based on pan mode
        chart.canvas.onmousedown = () => {
            if (chart.options.plugins.zoom.pan.enabled) {
                chart.canvas.style.cursor = 'grabbing';
            }
        };

        chart.canvas.onmouseup = () => {
            if (chart.options.plugins.zoom.pan.enabled) {
                chart.canvas.style.cursor = 'grab';
            }
        };
    }

    async loadChart(chartType, deviceId) {
        try {
            const today = new Date().toISOString().split("T")[0];
            const data = await ApiService.fetchChartData(deviceId, today);
            const config = CHART_CONFIGS[chartType];
            
            this.createChart(chartType, data.timeLabels, data[config.dataKey]);
        } catch (err) {
            console.error(`${chartType} chart error:`, err);
        }
    }

    cleanup() {
        this.zoomControls.cleanup();
        Object.keys(this.charts).forEach(chartType => this.destroyChart(chartType));
    }
}

/* ---------------------------
   Application Controller
---------------------------- */
class AppController {
    constructor() {
        this.chartManager = new ChartManager();
        this.refreshInterval = null;
    }

    async initialize() {
        try {
            // Load Chart.js zoom plugin
            await this.loadZoomPlugin();
            
            // Add instructions
            this.addInstructions();
            
            await this.refreshAllCharts();
            this.startAutoRefresh();
        } catch (err) {
            console.error("Initialization failed:", err);
        }
    }

    async loadZoomPlugin() {
        // Try to load zoom plugin if not already loaded
        if (typeof Chart.register === 'function' && !Chart.registry.plugins.get('zoom')) {
            try {
                // Dynamically import if using modules, otherwise assume it's loaded
                const zoomPlugin = await import('https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.0/dist/chartjs-plugin-zoom.min.js');
                Chart.register(zoomPlugin.default || zoomPlugin);
            } catch (error) {
                console.warn('Zoom plugin could not be loaded:', error);
            }
        }
    }

    addInstructions() {
        const instructions = document.createElement('div');

        // Add keyboard style
        const style = document.createElement('style');
        style.textContent = `
            kbd {
                background: #1e293b;
                border: 1px solid #475569;
                border-radius: 3px;
                padding: 2px 6px;
                font-family: monospace;
                font-size: 11px;
                margin: 0 2px;
            }
        `;
    }

    async refreshAllCharts() {
        try {
            const deviceId = await ApiService.fetchLatestDevice();
            
            // Load all charts in parallel
            await Promise.all([
                this.chartManager.loadChart('temperature', deviceId),
                this.chartManager.loadChart('ph', deviceId),
                this.chartManager.loadChart('tds', deviceId)
            ]);
        } catch (err) {
            console.error("Chart refresh failed:", err);
        }
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(
            () => this.refreshAllCharts(),
            CONFIG.REFRESH_INTERVAL
        );
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    cleanup() {
        this.stopAutoRefresh();
        this.chartManager.cleanup();
    }
}

/* ---------------------------
   Initialize Application
---------------------------- */
const app = new AppController();

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// Make app available globally for debugging/control
window.app = app;