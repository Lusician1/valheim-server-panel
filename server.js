require("dotenv").config();
const required = ["SESSION_SECRET", "PANEL_PASSWORD_HASH"];
const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}. See .env.example`);
  process.exit(1);
}

/* ---------------------- Express ---------------------- */
const express = require("express");
const app = express();
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

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

/* ------------------- Import scripts ------------------- */
const { spawn } = require("child_process");
const { checkPassword, requireLogin } = require("./lib/auth");
const { getStatus, controlServer } = require("./lib/valheim");
const { startUpdate, subscribe, isUpdating } = require("./lib/update");
const { error } = require("console");

/* --------------- Port the panel runs on --------------- */
const PORT = process.env.PORT || 3000;

/* ----------------------- Routes ----------------------- */
app.get("/", requireLogin, async (req, res) => {
  const data = await getStatus();
  res.render("index", { ...data, script: "/app.js" });
});

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

app.get("/about", (req, res) => {
  res.send("This is gonna be an awesome server panel for my valheim server ♥");
});

app.post("/api/server/:action", requireLogin, async (req, res) => {
  if (isUpdating()) {
    throw new Error("Server is updating");
  }
  try {
    await controlServer(req.params.action);
    res.json({ ok: true, ...(await getStatus()) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/update", requireLogin, (req, res) => {
  try {
    startUpdate();
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
  const unsubscribe = subscribe(send);

  req.on("close", unsubscribe);
});

app.get("/api/status", requireLogin, async (req, res) => {
  res.json(await getStatus());
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

app.get("/api/demo-stream", requireLogin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  let count = 1;
  const timer = setInterval(() => {
    res.write(`data: Line ${count}\n\n`);
    count++;

    if (count > 5) {
      clearInterval(timer);
      res.write("event: done\ndata: finished\n\n");
      res.end();
    }
  }, 1000);

  req.on("close", () => clearInterval(timer));
});
/* ENDTEST */

app.listen(PORT, () => {
  console.log(`Panel running on http://localhost:${PORT}`);
});
