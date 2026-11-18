# Valheim Panel

A web control panel for my self-hosted Valheim server. (Work in progress)

## Goal

A stylish web-panel for controlling and monitoring my server

## Current setup

- Server OS: Ubuntu live server
- How the game runs: systemd service with `steam` user that controls the server.
- Monitoring: Uptime Kuma

## Files in this repo

| File                           | Purpose                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `.env.example`                 | Example environment variables for the panel, login, RCON, and optional database       |
| `.gitignore`                   | Lists local files and folders Git should ignore                                       |
| `README.md`                    | Project overview, setup notes, and roadmap                                            |
| `TROUBLESHOOTING.md`           | Records troubleshooting notes for server monitoring                                   |
| `lib/auth.js`                  | Checks panel passwords and protects routes with login authentication                  |
| `lib/database.js`              | Configures the optional MySQL connection pool                                         |
| `lib/jobs.js`                  | Runs update or backup jobs and streams their output                                   |
| `lib/logs.js`                  | Reads server logs and derives player activity                                         |
| `lib/rcon.js`                  | Validates and sends chat messages through RCON                                        |
| `lib/system.js`                | Collects CPU, memory, and disk usage statistics                                       |
| `lib/valheim.js`               | Reads Valheim service status and controls the service                                 |
| `package-lock.json`            | Locks the Node.js dependency versions                                                 |
| `package.json`                 | Defines the Node.js application, scripts, and dependencies                            |
| `public/app.js`                | Updates the dashboard and handles server controls and jobs                            |
| `public/style.css`             | Styles the dashboard and login page                                                   |
| `scripts/backup_valheim.sh`    | Stops the server, copies world data to a dated backup, then restarts it               |
| `scripts/deploy.sh`            | Pulls the latest panel code, installs production dependencies, and restarts the panel |
| `scripts/hash-password.js`     | Generates a bcrypt hash for a panel password                                          |
| `scripts/start.sh.example`     | Example Valheim launch script with configurable world and server settings             |
| `scripts/update_valheim.sh`    | Stops the server, updates Valheim with SteamCMD, then restarts it                     |
| `server.js`                    | Configures and starts the web panel and its authenticated routes                      |
| `systemd/valheim.service.txt`  | Example systemd service and override configuration for the Valheim server             |
| `views/index.ejs`              | Renders the server dashboard                                                          |
| `views/layout.ejs`             | Provides the shared HTML page layout                                                  |
| `views/login.ejs`              | Renders the panel login form                                                          |

## How to update the server

sudo systemctl update_valheim

## Security choices

- Switched out the password in git with a dummy password to avoid leaking my password.
- Created a seperate steam user to run the server so an outsider taking control won't have access to anything else.
- Why `KillSignal=SIGINT`? To make sure Valheim saves the world before closing.
- Only strings sent by chat to avoid attacker inputting unwanted things.

## Roadmap

- [x] Phase 0: Server as a service, update script, monitoring
- [x] Phase 1: Status page (Node.js)
- [x] Phase 2: Start/stop buttons + login
- [x] Phase 3: Update button with live output
- [x] Phase 4: Server info: player info, log viewer, CPU/RAM/disk + backup button
- [x] Phase 5: BepInEx and RCON install for server monitoring
- [x] Phase 6: Send chat messages to the game from the panel
- [ ] Phase 7: Mod management in panel
- [ ] Phase 8: Version and world selection + World creation (Stretch goal)
