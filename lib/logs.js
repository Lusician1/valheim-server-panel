const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);

const LOG_LINES = 50;

async function readJournal(extraArgs) {
  try {
    const { stdout } = await execFileAsync("journalctl", [
      ...extraArgs,
      "--no-pager",
      "-o",
      "json",
      "--output-fields=MESSAGE",
    ]);
    return stdout
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => {
        const entry = JSON.parse(line);
        const date = new Date(Number(entry.__REALTIME_TIMESTAMP) / 1000);
        return {
          time: date.toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" }),
          timestamp: date.toISOString(),
          message: entry.MESSAGE,
        };
      });
  } catch (error) {
    if (error.code === 1) {
      return [];
    }
    console.error("Journalctl error:", error.message);
    throw error;
  }
}

// Fake lines for testing on Windows, where there's no journalctl
const FAKE_LOGS = [
  { time: "09:20:41", message: "Game server connected" },
  {
    time: "09:44:03",
    message: "Got character ZDOID from Lusician : -654321:1",
  },
  { time: "10:20:12", message: "Got character ZDOID from Gnur : -123456:1" },
  { time: "10:31:58", message: "World save (5/5) done. Total time [110ms]" },
];

const FAKE_PLAYERS = {
  online: 2,
  seen: [
    { name: "Gnur", lastSeen: "2026-11-10T18:20:12.000Z" },
    { name: "Lusician", lastSeen: "2026-11-13T15:13:50.000Z" },
  ],
};

async function getRecentLogs() {
  if (process.platform !== "linux") {
    return FAKE_LOGS;
  }

  return readJournal(["-u", "valheim", "-n", String(LOG_LINES)]);
}

async function getPlayers() {
  if (process.platform !== "linux") {
    return FAKE_PLAYERS;
  }

  const { stdout } = await execFileAsync("systemctl", [
    "show",
    "-p",
    "InvocationID",
    "--value",
    "valheim",
  ]);
  const invocationId = stdout.trim();
  if (!invocationId) {
    return { online: 0, seen: [] };
  }

  const entries = await readJournal([
    `_SYSTEMD_INVOCATION_ID=${invocationId}`,
    "--grep",
    "Got character ZDOID|Connections",
  ]);

  let online = 0;
  const seen = new Map();

  for (const entry of entries) {
    const connections = entry.message.match(/Connections (\d+)/);
    if (connections) {
      online = Number(connections[1]);
    }

    const join = entry.message.match(
      /Got character ZDOID from (.+?) : (-?\d+):(\d+)/,
    );
    const isDeath = join && join[2] === "0" && join[3] === "0";
    if (join && !isDeath) {
      seen.set(join[1], entry.timestamp);
    }
  }

  const seenList = [...seen]
    .map(([name, lastSeen]) => ({ name, lastSeen }))
    .reverse();
  return { online, seen: seenList };
}

module.exports = { getRecentLogs, getPlayers };
