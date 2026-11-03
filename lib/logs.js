const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);

const LOG_LINES = 50;

async function readJournal(extraArgs) {
  const { stdout } = await execFileAsync("journalctl", [
    ...extraArgs,
    "--no-pager",
    "-o",
    "json",
    "--output-fields=MESSAGE",
  ]);

  try {
    return stdout
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => {
        const entry = JSON.parse(line);
        const date = new Date(Number(entry.__REALTIME_TIMESTAMP) / 1000);
        return {
          time: date.toLocaleTimeString("nb-NO", { timeZone: "Europe/Oslo" }),
          message: entry.MESSAGE,
        };
      });
  } catch (error) {
    if (error.code === 1) {
      return [];
    }
    console.error("Database error:", error.message);
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

async function getRecentLogs() {
  if (process.platform !== "linux") {
    return FAKE_LOGS;
  }

  return readJournal(["-u", "valheim", "-n", String(LOG_LINES)]);
}

module.exports = { getRecentLogs };
