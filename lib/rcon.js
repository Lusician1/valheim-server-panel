/* For chat and player monitoring */

const { Rcon } = require("rcon-client");

const rconConfigured = Boolean(process.env.RCON_PASSWORD);
const livePlayersAvailable = rconConfigured || process.platform !== "linux";
const MAX_MESSAGE_LENGTH = 200;

const FAKE_ONLINE = {
  online: 5,
  players: [
    {
      name: "Gnorp",
      platformName: "Lusician",
      steamId: "76561198000000001",
      position: { x: -99.05, y: 32.55, z: -240.87 },
      publicPosition: true,
      hp: 50.05,
      maxHp: 50.05,
    },
    {
      name: "Ragnhild",
      platformName: "Viking42",
      steamId: "76561198000000002",
      position: { x: 1520.4, y: 41.2, z: 890.7 },
      publicPosition: true,
      hp: 31.2,
      maxHp: 62,
    },
    {
      name: "Sven the Unlucky",
      platformName: "SvenGamer",
      steamId: "76561198000000003",
      position: { x: -4210.8, y: 28.9, z: 3305.1 },
      publicPosition: false,
      hp: 4.5,
      maxHp: 75,
    },
    {
      name: "Thora",
      platformName: "ThoraX",
      steamId: null,
      position: { x: 12.3, y: 120.6, z: -15.8 },
      publicPosition: true,
      hp: 88,
      maxHp: 100,
    },
    {
      name: "Mystery",
      platformName: "Unknown",
      steamId: null,
      position: null,
      publicPosition: null,
      hp: null,
      maxHp: null,
    },
  ],
};

async function sendCommand(command) {
  if (!rconConfigured) {
    throw new Error("RCON is not configured");
  }

  const rcon = await Rcon.connect({
    host: process.env.RCON_HOST || "127.0.0.1",
    port: Number(process.env.RCON_PORT) || 2458,
    password: process.env.RCON_PASSWORD,
  });

  try {
    return await rcon.send(command);
  } finally {
    rcon.end();
  }
}

function validationError(text) {
  const error = new Error(text);
  error.status = 400;
  return error;
}

async function say(message) {
  return sendCommand(`say ${message}`);
}

function validateMessage(message) {
  if (typeof message !== "string") {
    throw validationError("Invalid message: Not a string");
  }
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw validationError("There is no message to send");
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    throw validationError(
      `The message is ${trimmedMessage.length} characters while I only gave you permission to write messages that were ${MAX_MESSAGE_LENGTH} characters long...`,
    );
  }
  if (/[\x00-\x1F\x7F]/.test(trimmedMessage)) {
    throw validationError(
      "Message can't contain line breaks or special characters!",
    );
  }

  return trimmedMessage;
}

function parsePlayers(output) {
  const lines = output.split("\n");

  const countMatch = lines[0].match(/Online (\d+)/);
  const online = countMatch ? Number(countMatch[1]) : 0;

  const players = [];

  for (const line of lines.slice(1)) {
    const text = line.trim();
    if (text === "") continue;

    const nameMatch = text.match(/^(.+?) Steam ID:/);
    if (!nameMatch) continue;

    const platformMatch = text.match(/Platform name: (.+)$/);
    const positionMatch = text.match(
      /Position: \((-?[\d.]+) (-?[\d.]+) (-?[\d.]+)\)/,
    );
    const positionVisibilityMatch = text.match(/Public position: (True|False)/);
    const hpMatch = text.match(/HP:([\d.]+)\/([\d.]+)/);
    const steamIdMatch = text.match(/Steam ID:Steam_(\d+)/);
    players.push({
      name: nameMatch[1],
      platformName: platformMatch ? platformMatch[1] : "Unknown",
      steamId: steamIdMatch ? steamIdMatch[1] : null,
      position: positionMatch
        ? {
            x: Number(positionMatch[1]),
            y: Number(positionMatch[2]),
            z: Number(positionMatch[3]),
          }
        : null,
      publicPosition: positionVisibilityMatch
        ? positionVisibilityMatch[1] === "True"
        : null,
      hp: hpMatch ? Number(hpMatch[1]) : null,
      maxHp: hpMatch ? Number(hpMatch[2]) : null,
    });
  }

  return { online, players };
}

async function getOnlinePlayers() {
  if (process.platform !== "linux") {
    return FAKE_ONLINE;
  }
  const playerInfo = await sendCommand("players");
  return parsePlayers(playerInfo);
}

module.exports = {
  rconConfigured,
  livePlayersAvailable,
  say,
  validateMessage,
  getOnlinePlayers,
  parsePlayers,
};
