function updateBatteryIcon(level) {
    const icon = document.querySelector('.fa-battery-full');

    icon.className = 'fa-solid'; // reset

    if (level > 80) icon.classList.add('fa-battery-full');
    else if (level > 50) icon.classList.add('fa-battery-three-quarters');
    else if (level > 25) icon.classList.add('fa-battery-half');
    else if (level > 10) icon.classList.add('fa-battery-quarter');
    else icon.classList.add('fa-battery-empty');
}

function updateSignal(strength) {
    const icon = document.querySelector('.fa-signal');

    icon.className = 'fa-solid';

    if (strength === 'excellent') icon.classList.add('fa-signal');
    else if (strength === 'good') icon.classList.add('fa-signal');
    else icon.classList.add('fa-triangle-exclamation');
}
