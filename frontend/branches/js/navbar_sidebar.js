const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.tab-pane');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {

        // Remove active state
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('show', 'active'));

        // Activate clicked tab
        tab.classList.add('active');

        // Show matching section
        const targetId = tab.dataset.target;
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.classList.add('show', 'active');
        }
    });
});


// Dropdown functionality on navbar
const notifyBtn = document.getElementById('notifyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const notificationsCard = document.getElementById('notificationsCard');
const settingsCard = document.getElementById('settingsCard');

function closeAllDropdowns() {
    notificationsCard.style.display = 'none';
    settingsCard.style.display = 'none';
}

notifyBtn.addEventListener('click', () => {
    const visible = notificationsCard.style.display === 'block';
    closeAllDropdowns();
    notificationsCard.style.display = visible ? 'none' : 'block';
});

settingsBtn.addEventListener('click', () => {
    const visible = settingsCard.style.display === 'block';
    closeAllDropdowns();
    settingsCard.style.display = visible ? 'none' : 'block';
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.icon-btn') && !e.target.closest('.dropdown-card')) {
        closeAllDropdowns();
    }
});

/* Update map location */
document.getElementById('updateLocation').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);

    if (!isNaN(lat) && !isNaN(lng)) {
        map.setView([lat, lng], 14);
        L.marker([lat, lng]).addTo(map);
    }
});
