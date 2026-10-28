const { spawn } = require("child_process");
const { exitCode } = require("process");

const UPDATE_SCRIPT = "/usr/local/sbin/valheim-update";

const job = {
  running: false,
  lines: [],
  exitCode: null,
  listeners: new Set(),
};

function broadcast(event, data) {
  for (const send of job.listeners) {
    send(event, data);
  }
}

function addLine(text) {
  job.lines.push(text);
  broadcast("line", text);
}

function finish(code) {
  if (!job.running) return;
  job.running = false;
  job.exitCode = code;
  addLine(
    `Update finished at: ${new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" })}`,
  );
  broadcast("done", String(code));
}

function startUpdate() {
  if (job.running) {
    throw new Error("Game is already updating");
  }
  job.running = true;
  job.lines = [];
  job.exitCode = null;

  // devtest for windows since no update script :))
  const [command, args] =
    process.platform === "linux"
      ? ["sudo", ["-n", UPDATE_SCRIPT]]
      : ["ping", ["-n", "5", "127.0.0.1"]];

  addLine(
    `Update started at: ${new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" })}`,
  );
  const child = spawn(command, args);

  const onData = (chunk) => {
    for (const line of chunk.toString().split("\n")) {
      const text = line.replace(/\x1b\[[0-9;]*m/g, "").trim();
      if (text !== "") addLine(text);
    }
  };

  child.stdout.on("data", onData);
  child.stderr.on("data", onData);

  child.on("error", (error) => {
    addLine(`Could not start the update: ${error.message}`);
    finish(-1);
  });
  child.on("close", (code) => finish(code));
}

function subscribe(send) {
  for (const line of job.lines) {
    send("line", line);
  }
  if (!job.running) {
    send("done", String(job.exitCode));
    return () => {};
  }
  job.listeners.add(send);
  return () => job.listeners.delete(send);
}

function isUpdating() {
  return job.running;
}

module.exports = { startUpdate, subscribe, isUpdating };
