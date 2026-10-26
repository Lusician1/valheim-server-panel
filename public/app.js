const buttons = document.querySelectorAll('.controls .btn');

async function serverAction(action) {
  if (action === 'stop' && !confirm('Stop the server? Players will be disconnected.')) {
    return;
  }

  buttons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`/api/server/${action}`, { method: 'POST' });
    const data = await response.json();
    if(!data.ok) {
      alert('Failed: ' + data.error );
    }
  } finally {
    buttons.forEach(btn => btn.disabled = false);
    loadStatus();
  }
}

document.getElementById('startSrv').addEventListener('click', () => serverAction('start'));
document.getElementById('stopSrv').addEventListener('click', () => serverAction('stop'));



async function loadStatus() {
  const badge = document.getElementById("status");
  const checkedAt = document.getElementById("checkedAt");

  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    badge.textContent = data.status;
    badge.className = "badge badge-lg " + data.status;
    checkedAt.textContent = new Date(data.checkedAt).toLocaleTimeString("nb-NO");
  } catch (error) {
    badge.textContent = "panel offline";
    badge.className = "badge badge-lg unknown";
  }
}

setInterval(loadStatus, 5 * 1000);
