const os = require("os");
const fs = require("fs/promises");

const toGB = (bytes) => Number((bytes / 1024 ** 3).toFixed(1));
const percent = (part, whole) => Math.round((part / whole) * 100);

/* ------------- CPU is tricky. Needs it's own function ------------- */
function cpuTimes() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const time of Object.values(cpu.times)) {
      total += time;
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

let lastCpu = cpuTimes();

function cpuPercent() {
  const now = cpuTimes();
  const idle = now.idle - lastCpu.idle;
  const total = now.total - lastCpu.total;
  lastCpu = now;
  if (total === 0) return 0;
  return Math.round(100 * (1 - idle / total));
}

/* ------------------------- All stats -------------------------------- */
async function getSystemStats() {
  const memTotal = os.totalmem();
  const memUsed = memTotal - os.freemem();

  const disk = await fs.statfs("/");
  const diskTotal = disk.blocks * disk.bsize;
  const diskUsed = diskTotal - disk.bfree * disk.bsize;

  return {
    cpu: cpuPercent(),
    memory: {
      used: toGB(memUsed),
      total: toGB(memTotal),
      percent: percent(memUsed, memTotal),
    },
    disk: {
      used: toGB(diskUsed),
      total: toGB(diskTotal),
      percent: percent(diskUsed, diskTotal),
    },
  };
}

module.exports = { getSystemStats };
