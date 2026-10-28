# Valheim Panel

A web control panel for my self-hosted Valheim server. (Work in progress)

## Goal

A neat looking control panel for controlling updates, mods, backups, etc.

## Current setup

- Server OS: Ubuntu live server
- How the game runs: systemd service with `steam` user that controls the server.
- Monitoring: Uptime Kuma, push monitor via cron

## Files in this repo

| File                          | Purpose                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `scripts/update_valheim.sh`   | Automatically saves and exits the world before updating the game                                   |
| `scripts/start.sh.example`    | Configurable script for creating a world if not created already, and starting the world            |
| `systemd/valheim.service.txt` | Snapshot of the systemd service and override that runs the server                                  |
| `scripts/backup_valheim.sh`   | Safely exits, backs up worlds, then starts the server                                              |
| `scripts/hash-password.js`    | Asks for user to input password and sends back a hash for it. Should be changed later for security |

## How to update the server

sudo systemctl update_valheim

## Security choices

- Switched out the password in git with a dummy password to avoid unwanted people in my server
- Created a seperate steam user to run the server so an outsider taking control won't have access to anything else.
- Why `KillSignal=SIGINT`? To make sure Valheim saves the world before closing.

## Roadmap

- [x] Phase 0: Server as a service, update script, monitoring
- [x] Phase 1: Status page (Node.js)
- [x] Phase 2: Start/stop buttons + login
- [x] Phase 3: Update button with live output
- [ ] Phase 4: Server info: player info, log viewer, CPU/RAM/disk + backup button
