const ctx = document.getElementById('tempChart').getContext('2d');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['#1', '#2', '#3', '#4', '#5', '#6'],
        datasets: [{
            label: 'Temperature (°C)',
            data: [35, 50, 95, 70, 45, 80],
            backgroundColor: [
                '#4cc9f0',
                '#4cc9f0',
                '#f72585',
                '#f8961e',
                '#4cc9f0',
                '#f8961e'
            ]
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 100
            }
        }
    }
});
