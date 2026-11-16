/* For chat and player monitoring */

const { Rcon } = require("rcon-client");

const rconConfigured = Boolean(process.env.RCON_PASSWORD);

async function sendCommand(command) {
  if (!rconConfigured) {
    throw new Error("RCON is not configured");
  }

  const rcon = await Rcon.connect({
    host: process.env.RCON_WHITELIST_IP || "127.0.0.1",
    port: Number(process.env.RCON_PORT) || 2458,
    password: process.env.RCON_PASSWORD,
  });

  try {
    return await rcon.send(command);
  } finally {
    rcon.end();
  }
}

async function say(message) {
  return sendCommand(`say ${message}`);
}

function validateMessage(message) {
  const trimmedMessage = message.trim();
  const MAX_MESSAGE_LENGTH = 200;
  if (message !== "string") {
    /* FIX DWADWADWADWA */
    throw new Error("Nuh uh");
  }
  if (!trimmedMessage) {
    throw new Error("There is no message to send");
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(
      `The message is ${message.length} characters while I only gave you permision to write messages that were ${MAX_MESSAGE_LENGTH} characters long...`,
    );
  }

  return message;
}

module.exports = { say, rconConfigured };
