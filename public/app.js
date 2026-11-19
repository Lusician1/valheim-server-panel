const buttons = document.querySelectorAll(".controls .btn");
let busy = false;
const startBtn = document.getElementById("startSrv");
const stopBtn = document.getElementById("stopSrv");
const restartBtn = document.getElementById("restartSrv");
const updateBtn = document.getElementById("updateSrv");
const backupBtn = document.getElementById("backupSrv");
const jobCard = document.getElementById("jobCard");
const jobLog = document.getElementById("jobLog");
const jobState = document.getElementById("jobState");
const jobTitle = document.getElementById("jobTitle");
const JOB_TITLES = { update: "Update output", backup: "Backup output" };
let jobStream = null;
const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendMsg");
const chatError = document.getElementById("chatError");

async function loadStatus() {
  const badge = document.getElementById("status");
  const checkedAt = document.getElementById("checkedAt");

  if (document.hidden) return;

  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    if (data.job) {
      watchJob(data.job);
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

function watchJob(name) {
  if (jobStream) return;

  busy = true;
  buttons.forEach((btn) => (btn.disabled = true));

  jobTitle.textContent = JOB_TITLES[name];
  jobCard.hidden = false;
  jobState.textContent = "Running";
  jobState.className = "pill running";

  jobStream = new EventSource(`/api/${name}/stream`);

  jobStream.addEventListener("open", () => {
    jobLog.textContent = "";
  });

  jobStream.addEventListener("line", (event) => {
    jobLog.textContent += event.data + "\n";
    jobLog.scrollTop = jobLog.scrollHeight;
  });

  jobStream.addEventListener("done", (event) => {
    jobStream.close();
    jobStream = null;

    const success = event.data === "0";
    jobState.textContent = success ? "Finished" : `Failed (code ${event.data})`;
    jobState.className = success ? "pill success" : "pill failed";

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

    if (lines.length === 0) {
      const empty = document.createElement("li");
      empty.textContent = "No log lines yet";
      empty.className = "muted";
      box.replaceChildren(empty);
      return;
    }
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

async function startJob(name, confirmText) {
  if (!confirm(confirmText)) {
    return;
  }
  try {
    const response = await fetch(`/api/${name}`, { method: "POST" });
    const data = await response.json();
    if (!data.ok) {
      alert("Failed: " + data.error);
      return;
    }
    watchJob(name);
  } catch (error) {
    alert("Could not reach the panel");
  }
}
updateBtn.addEventListener("click", () =>
  startJob(
    "update",
    "Update the server? The server will have to stop during the update, which will kick all active players. This will result in loss of progress if they haven't saved...",
  ),
);
backupBtn.addEventListener("click", () =>
  startJob(
    "backup",
    "Back up the server? The server will have to stop during the backup, which will kick all active players. This will result in loss of progress if they haven't saved...",
  ),
);

function formatLastSeen(iso) {
  const date = new Date(iso);
  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleString("nb-NO", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function makePlayerRow(player) {
  const item = document.createElement("li");
  item.className = "player-card";

  const playerName = document.createElement("span");
  playerName.textContent = player.name;
  const playerLastSeen = document.createElement("span");
  playerLastSeen.className = "muted";
  playerLastSeen.textContent = formatLastSeen(player.lastSeen);
  item.append(playerName, playerLastSeen);
  return item;
}

function makeOnlineRow(player) {
  const item = document.createElement("li");
  item.className = "player-card";
  const top = document.createElement("div");
  const middle = document.createElement("div");
  const bottom = document.createElement("div");
  bottom.style = "width: 100%";

  const img = document.createElement("div");
  img.style = "width: 40px; height: 40px";
  const name = document.createElement("span");
  name.textContent = player.name;

  const hp = document.createElement("span");
  hp.className = "muted hp-text";
  hp.textContent =
    player.hp === null
      ? ""
      : `${Math.round(player.hp)} / ${Math.round(player.maxHp)} HP`;

  const hpRatio = Math.round((player.hp / player.maxHp) * 100);
  const test = document.createElement("p");
  test.textContent = hpRatio;
  const maxHpBar = document.createElement("div");
  maxHpBar.className = "bar bar-max-hp";
  const currentHpBar = document.createElement("div");
  currentHpBar.id = "hpBar";
  currentHpBar.className = "bar-fill bar-fill-hp";
  currentHpBar.style = `width: ${hpRatio}%`;
  currentHpBar.style.backgroundColor = `hsl(${hpRatio * 1.2}, 65%, 45%)`;

  /* <div class="bar">
        <div
          id="cpuBar"
          class="bar-fill"
          style="width: <%= system.cpu %>%"
        ></div> */
  top.append(img);
  middle.append(name);
  bottom.append(hp, maxHpBar);
  maxHpBar.append(currentHpBar);
  item.append(top, middle, bottom);
  return item;
}

async function loadPlayers() {
  try {
    const response = await fetch("/api/players");
    const data = await response.json();

    const list = document.getElementById("playerList");
    const label = document.getElementById("playerLabel");
    document.getElementById("playerCount").textContent = data.online;

    const isLive = Array.isArray(data.players);
    const entries = isLive ? data.players : data.seen;

    label.textContent = isLive ? "Online now" : "Seen this session";

    if (document.hidden) return;

    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "muted";
      empty.textContent = isLive
        ? "Nobody online right now"
        : "No players since last restart";
      list.replaceChildren(empty);
      return;
    }

    list.replaceChildren(
      ...entries.map(isLive ? makeOnlineRow : makePlayerRow),
    );
  } catch (error) {
    console.error(error);
  }
}

async function sendChatMessage(event) {
  event.preventDefault();
  sendBtn.disabled = true;
  try {
    console.log("fetching api");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msgInput.value }),
    });
    const data = await response.json();
    console.log("Validating data...");
    if (!data.ok) {
      chatError.textContent = data.error;
      console.log(data.error);
      return;
    }
    msgInput.value = "";
    chatError.textContent = "";
    loadLogs();
  } catch (error) {
    console.error(error);
    chatError.textContent = "Could not reach the panel.";
  } finally {
    sendBtn.disabled = false;
  }
}

msgForm.addEventListener("submit", sendChatMessage);

loadPlayers();
setInterval(loadPlayers, 30 * 1000);

loadStatus();
loadLogs();
setInterval(loadLogs, 10 * 1000);
setInterval(loadStatus, 5 * 1000);
