async function loadStatus(){
    const badge = document.getElementById('status');

    try {
        const response = await fetch('/api/status')
        const data = await response.json()

        badge.textContent = data.status;
        badge.className = await response.json
    } catch (error) {
        badge.textContent = 'panel_offline';
        badge.className = 'badge unknown';
    }
};

setInterval(loadStatus(), 10 * 1000);