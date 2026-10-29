const buttons = document.querySelectorAll(".controls .btn");
let busy = false;
const startBtn = document.getElementById("startSrv");
const stopBtn = document.getElementById("stopSrv");
const restartBtn = document.getElementById("restartSrv");
const updateBtn = document.getElementById("updateSrv");
const updateCard = document.getElementById("updateCard");
const updateLog = document.getElementById("updateLog");
const updateState = document.getElementById("updateState");
let updateStream = null;

async function loadStatus() {
  const badge = document.getElementById("status");
  const checkedAt = document.getElementById("checkedAt");

  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    if (data.updating) {
      watchUpdate();
    }

    if (!busy) {
      startBtn.disabled = data.status === "active" || data.status === "unknown";
      stopBtn.disabled =
        data.status === "inactive" || data.status === "unknown";
      restartBtn.disabled = data.status === "unknown";
    }
    badge.textContent = data.status;
    badge.className = "badge badge-lg " + data.status;
    checkedAt.textContent = new Date(data.checkedAt).toLocaleTimeString(
      "nb-NO",
    );
    document.getElementById("cpuValue").textContent = data.system.cpu;
    setBar("cpuBar", data.system.cpu);
    document.getElementById("memoryValue").textContent =
      data.system.memory.used;
    setBar("memoryBar", data.system.memory.percent);
    document.getElementById("diskValue").textContent = data.system.disk.used;
    setBar("diskBar", data.system.disk.percent);
  } catch (error) {
    buttons.forEach((btn) => (btn.disabled = true));
    badge.textContent = "panel offline";
    badge.className = "badge badge-lg unknown";
  }
}

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
    console.error(error);
    alert("Could not reach the panel.");
  } finally {
    busy = false;
    buttons.forEach((btn) => (btn.disabled = false));
    button.textContent = originalText;
    loadStatus();
  }
}

function watchUpdate() {
  if (updateStream) return;

  busy = true;
  buttons.forEach((btn) => (btn.disabled = true));

  updateCard.hidden = false;
  updateState.textContent = "Running";
  updateState.className = "pill running";

  updateStream = new EventSource("/api/update/stream");

  updateStream.addEventListener("open", () => {
    updateLog.textContent = "";
  });

  updateStream.addEventListener("line", (event) => {
    updateLog.textContent += event.data + "\n";
    updateLog.scrollTop = updateLog.scrollHeight;
  });

  updateStream.addEventListener("done", (event) => {
    updateStream.close();
    updateStream = null;

    const success = event.data === "0";
    updateState.textContent = success
      ? "Finished"
      : `Failed (code ${event.data})`;
    updateState.className = success ? "pill success" : "pill failed";

    busy = false;
    buttons.forEach((btn) => (btn.disabled = false));
    loadStatus();
  });
}

function setBar(id, value) {
  const button = document.getElementById(id);
  button.style.width = value + "%";
  button.classList.toggle("high", value >= 85);
}

function makeLogLine(line) {
  const item = document.createElement("li");

  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = line.time;

  item.append(time, " ", line.message);
  return item;
}

async function loadLogs() {
  try {
    const response = await fetch("/api/logs");
    const lines = await response.json();

    const box = document.getElementById("serverLog");
    const wasAtBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 20;

    box.replaceChildren(...lines.map(makeLogLine));

    if (wasAtBottom) {
      box.scrollTop = box.scrollHeight;
    }
  } catch (error) {
    console.error(error);
  }
}

startBtn.addEventListener("click", () => serverAction("start", startBtn));
stopBtn.addEventListener("click", () => serverAction("stop", stopBtn));
restartBtn.addEventListener("click", () => serverAction("restart", restartBtn));
updateBtn.addEventListener("click", async () => {
  if (
    !confirm(
      "Update the server? It will be stopped during the update, and players will be disconnected. Make sure all players have saved their characters.",
    )
  ) {
    return;
  }

  try {
    const response = await fetch("/api/update", { method: "POST" });
    const data = await response.json();
    if (!data.ok) {
      alert("Failed: " + data.error);
      return;
    }
    watchUpdate();
  } catch (error) {
    alert("Could not reach the panel.");
  }
});

loadStatus();
loadLogs();
setInterval(loadLogs, 10 * 1000);
setInterval(loadStatus, 5 * 1000);
