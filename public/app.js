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
