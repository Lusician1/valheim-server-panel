const fs = require("fs/promises");
const path = require("path");
const { text } = require("stream/consumers");

const PLUGINS_DIR = "/home/steam/valheim/BepInEx/plugins";

const FAKE_MODS = [
  {
    name: "ValheimRCON",
    version: "20.0.4",
    description: "RCON mod for commands",
    folder: "ValheimRCON",
  },
  {
    name: "BetterUI",
    version: "23.1",
    description: "Improves the UI of valheim",
    folder: "BetterUI",
  },
  {
    name: "Plant everything",
    version: "1.3",
    description: "Allows planting berry bushes and some decorative plants",
    folder: "PlantEverything",
  },
];

async function readManifest(folder) {
  const manifestPath = path.join(PLUGINS_DIR, folder, "manifest.json");
  try {
    const text = await fs.readFile(manifestPath, "utf-8");
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error(`No manifest for ${folder}:`, error.message);
    return null;
  }
}

async function getInstalledMods() {
  if (process.platform !== "linux") return FAKE_MODS;
  const entry = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
  folders = entry.filter(entry.isDirectory());
}

module.exports = { getInstalledMods };
