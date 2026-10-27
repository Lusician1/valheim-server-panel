const buttons = document.querySelectorAll(".controls .btn");
let busy = false;
const startBtn = document.getElementById("startSrv");
const stopBtn = document.getElementById("stopSrv");
const restartBtn = document.getElementById("restartSrv");

async function loadStatus() {
  const badge = document.getElementById("status");
  const checkedAt = document.getElementById("checkedAt");

  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    if (!busy) {
      /* startBtn.disabled = (data.status === 'active' || data.status === ('unknown'));
      stopBtn.disabled = (data.status === 'inactive' || data.status === ('unknown'));
      restartBtn.disabled = data.status === 'unknown' */
    }
    badge.textContent = data.status;
    badge.className = "badge badge-lg " + data.status;
    checkedAt.textContent = new Date(data.checkedAt).toLocaleTimeString(
      "nb-NO",
    );
  } catch (error) {
    buttons.forEach((btn) => (btn.disabled = true));
    badge.textContent = "panel offline";
    badge.className = "badge badge-lg unknown";
  }
}
loadStatus();

async function serverAction(action, button) {
  const originalText = button.textContent;

  if (
    action !== "start" &&
    !confirm(
      `${action[0].toUpperCase() + action.slice(1)} the server? Players will be disconnected.`,
    )
  ) {
    return;
  }
  busy = true;

  const buttonProcessTextContent = {
    start: "Starting...",
    stop: "Stopping...",
    restart: "Restarting...",
  };

  button.textContent = buttonProcessTextContent[action];
  buttons.forEach((btn) => (btn.disabled = true));

  try {
    const response = await fetch(`/api/server/${action}`, { method: "POST" });
    const data = await response.json();
    if (!data.ok) {
      alert("Failed: " + data.error);
    }
  } catch (error) {
    alert("Could not reach the panel.");
  } finally {
    busy = false;
    buttons.forEach((btn) => (btn.disabled = false));
    button.textContent = originalText;
    loadStatus();
  }
}

startBtn.addEventListener("click", () => serverAction("start", startBtn));
stopBtn.addEventListener("click", () => serverAction("stop", stopBtn));
restartBtn.addEventListener("click", () => serverAction("restart", restartBtn));

setInterval(loadStatus, 5 * 1000);
