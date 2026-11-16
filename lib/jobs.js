const { spawn } = require("child_process");

const now = () =>
  new Date().toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" });

function createJob(name, script) {
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
    addLine(`${name} finished at: ${now()}`);
    broadcast("done", String(code));
  }

  function start() {
    if (job.running) {
      throw new Error(`${name} is already running`);
    }
    job.running = true;
    job.lines = [];
    job.exitCode = null;

    // On Windows there are no scripts, so ping pretends to be one
    const [command, args] =
      process.platform === "linux"
        ? ["sudo", ["-n", script]]
        : ["ping", ["-n", "5", "127.0.0.1"]];

    addLine(`${name} started at: ${now()}`);
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
      addLine(`Could not start: ${error.message}`);
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

  function isRunning() {
    return job.running;
  }

  return { start, subscribe, isRunning };
}

module.exports = { createJob };
