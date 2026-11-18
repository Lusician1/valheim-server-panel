/* For chat and player monitoring */

const { Rcon } = require("rcon-client");

const rconConfigured = Boolean(process.env.RCON_PASSWORD);
const MAX_MESSAGE_LENGTH = 200;

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

  // 2. The players, from every line AFTER the first
  const players = [];

  for (const line of lines.slice(1)) {
    const text = line.trim();
    if (text === "") continue;

    const nameMatch = text.match(/^(.+?) Steam ID:/);
    if (!nameMatch) continue;

    const platformMatch = text.match(/Platform name: (.+)$/);
    const hpMatch = text.match(/HP:([\d.]+)\/([\d.]+)/);

    players.push({
      name: nameMatch[1],
      platformName: platformMatch ? platformMatch[1] : "Unknown",
      hp: hpMatch ? Number(hpMatch[1]) : null,
      maxHp: hpMatch ? Number(hpMatch[2]) : null,
    });
  }

  return { online, players };
}

async function getOnlinePlayers() {
  const playerInfo = await sendCommand("players");
  return parsePlayers(playerInfo);
}

module.exports = {
  say,
  rconConfigured,
  validateMessage,
  getOnlinePlayers,
  parsePlayers,
};
