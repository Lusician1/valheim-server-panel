/* ========================== Config ========================== */

require("dotenv").config();
const required = ["SESSION_SECRET", "PANEL_PASSWORD_HASH"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}. See .env.example`);
  process.exit(1);
}

/* ========================= Imports ========================== */
/* Packages */
const express = require("express");
const app = express();
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");

/* Scripts */
const { spawn } = require("child_process");
const { checkPassword, requireLogin } = require("./lib/auth");
const { getStatus, controlServer } = require("./lib/valheim");
const { createJob } = require("./lib/jobs");
const { getSystemStats } = require("./lib/system");
const { getRecentLogs, getPlayers } = require("./lib/logs");
const {
  say,
  validateMessage,
  rconConfigured,
  getOnlinePlayers,
  parsePlayers,
} = require("./lib/rcon");

/* ================ Constants and shared state ================= */
const PORT = process.env.PORT || 3000;

const updateJob = createJob("Update", "/usr/local/sbin/valheim-update");
const backupJob = createJob("Backup", "/usr/local/sbin/valheim-backup");
const anyJobRunning = () => updateJob.isRunning() || backupJob.isRunning();

/* ======================= App setup =========================== */
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    },
  }),
);

app.set("view engine", "ejs");
app.use(expressLayouts);
app.locals.panelName = process.env.PANEL_NAME;

/* ========================== Routes ============================ */

/* Pages */
app.get("/", requireLogin, async (req, res) => {
  const [status, system] = await Promise.all([getStatus(), getSystemStats()]);
  res.render("index", { ...status, system, script: "/app.js" });
});

/* Auth */
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const ok = await checkPassword(req.body.password || "");

  if (!ok) {
    return res.status(401).render("login", { error: "Wrong password" });
  }

  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).send("Session error");
    }
    req.session.loggedIn = true;
    res.redirect("/");
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

/* Server */
app.get("/api/status", requireLogin, async (req, res) => {
  const [status, system] = await Promise.all([getStatus(), getSystemStats()]);
  res.json({
    ...status,
    job: updateJob.isRunning()
      ? "update"
      : backupJob.isRunning()
        ? "backup"
        : null,
    system,
  });
});

app.post("/api/server/:action", requireLogin, async (req, res) => {
  if (anyJobRunning()) {
    return res.status(409).json({ ok: false, error: "A job is running" });
  }
  try {
    await controlServer(req.params.action);
    res.json({ ok: true, ...(await getStatus()) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

/* Jobs */
app.post("/api/update", requireLogin, (req, res) => {
  if (anyJobRunning()) {
    return res
      .status(409)
      .json({ ok: false, error: "A job is already running" });
  }
  try {
    updateJob.start();
    res.json({ ok: true });
  } catch (error) {
    res.status(409).json({ ok: false, error: error.message });
  }
});

app.get("/api/update/stream", requireLogin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${data}\n\n`);
  const unsubscribe = updateJob.subscribe(send);

  req.on("close", unsubscribe);
});

app.post("/api/backup", requireLogin, (req, res) => {
  if (anyJobRunning()) {
    return res
      .status(409)
      .json({ ok: false, error: "A job is already running" });
  }
  try {
    backupJob.start();
    res.json({ ok: true });
  } catch (error) {
    res.status(409).json({ ok: false, error: error.message });
  }
});

app.get("/api/backup/stream", requireLogin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${data}\n\n`);
  req.on("close", backupJob.subscribe(send));
});

/* Logs */
app.get("/api/logs", requireLogin, async (req, res) => {
  try {
    res.json(await getRecentLogs());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/players", requireLogin, async (req, res) => {
  if (rconConfigured) {
    try {
      return res.json(await getOnlinePlayers());
    } catch (error) {
      console.error(
        "RCON players failed, using the log instead:",
        error.message,
      );
    }
  }
  try {
    res.json(await getPlayers());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* Chat */
app.post("/api/chat", requireLogin, async (req, res) => {
  try {
    const message = validateMessage(req.body.message);
    await say(message);
    res.json({ ok: true });
  } catch (error) {
    console.error("Chat error:", error);

    if (error.status === 400) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    res.status(503).json({
      ok: false,
      error: "Could not reach the game server. Is it running?",
    });
  }
});

/* TEST */
app.get("/api/ping-stream", requireLogin, (req, res) => {
  const countFlag = process.platform === "linux" ? "-c" : "-n";
  const child = spawn("ping", [countFlag, "5", "127.0.0.1"]);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  child.stdout.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");
    for (const line of lines) {
      const text = line.trim();
      if (text === "") continue;
      res.write(`data: ${text}\n\n`);
    }
  });

  child.on("close", (code) => {
    res.write(`event: done\ndata: ${code}\n\n`);
    res.end();
  });
  req.on("close", () => child.kill());
});
/* ENDTEST */

/* ========================== Start ================================ */

app.listen(PORT, () => {
  console.log(`Panel running on http://localhost:${PORT}`);
});
