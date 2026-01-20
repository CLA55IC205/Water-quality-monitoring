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


const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");

const tabButtons = document.querySelectorAll(".tab, .sidebar-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

/* ===============================
   SIDEBAR TOGGLE
================================ */
hamburger.addEventListener("click", (e) => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    e.stopPropagation();
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
});

/* ===============================
   TAB SWITCHING (FIXED)
================================ */
tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;

        tabPanes.forEach((pane) => {
            pane.classList.remove("active", "show");
        });

        const activePane = document.getElementById(target);
        activePane.classList.add("active", "show");

        // Close sidebar after selection (mobile)
        sidebar.classList.remove("active");
        overlay.classList.remove("active");

        //  Force charts to resize AFTER tab becomes visible
        setTimeout(resizeAllCharts, 200);
    });
});

/* ===============================
   CHART RESIZE FIX
================================ */
function resizeAllCharts() {
    if (!window.Chart) return;

    Object.values(Chart.instances).forEach(chart => {
        chart.resize();
        chart.update();
    });
}


/* ===============================
   CLOSE SIDEBAR ON OUTSIDE CLICK
================================ */
document.addEventListener("click", (e) => {
    const isSidebarOpen = sidebar.classList.contains("active");

    if (!isSidebarOpen) return;

    const clickedInsideSidebar = sidebar.contains(e.target);
    const clickedHamburger = hamburger.contains(e.target);

    if (!clickedInsideSidebar && !clickedHamburger) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    }
});
