const avatarCache = new Map();

async function getAvatars(steamIds) {
  const key = process.env.STEAM_API_KEY;
  if (!key || steamIds.length === 0) return {};

  const missing = steamIds.filter((id) => !avatarCache.has(id));

  if (missing.length > 0) {
    try {
      const url =
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/" +
        `?key=${key}&steamids=${missing.join(",")}`;
      const response = await fetch(url);
      const data = await response.json();

      for (const player of data.response.players) {
        avatarCache.set(player.steamid, player.avatarfull);
      }
    } catch (error) {
      console.error("Steam avatar lookup failed:", error.message);
    }
  }

  const result = {};
  for (const id of steamIds) {
    result[id] = avatarCache.get(id) || null;
  }
  return result;
}

module.exports = { getAvatars };
