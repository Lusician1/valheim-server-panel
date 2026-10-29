const { execFile } = require("child_process");
const util = require("util");
const execFileAsync = util.promisify(execFile);

const LOG_LINES = 50;

// Fake lines for testing on Windows, where there's no journalctl
const FAKE_LOGS = [
  { time: "10:31:58", message: "World save (5/5) done. Total time [110ms]" },
  { time: "10:20:12", message: "Got character ZDOID from Gnur : -123456:1" },
  {
    time: "09:44:03",
    message: "Got character ZDOID from Lusician : -654321:1",
  },
  { time: "09:20:41", message: "Game server connected" },
];

async function getRecentLogs() {
  if (process.platform !== "linux") {
    return FAKE_LOGS;
  }

  const { stdout } = await execFileAsync("journalctl", [
    "-u",
    "valheim",
    "-n",
    String(LOG_LINES),
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
        message: entry.MESSAGE,
      };
    })
    .reverse();
}

module.exports = { getRecentLogs };
