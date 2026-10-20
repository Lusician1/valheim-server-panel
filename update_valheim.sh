#!/bin/bash
set -e
STEAMCMD=/usr/games/steamcmd   # use your path from step 1

echo "Stopping server..."
systemctl stop valheim

echo "Updating..."
sudo -u steam -H "$STEAMCMD" +force_install_dir /home/steam/valheim +login anonymous +app_update 896660 validate +quit

echo "Starting server..."
systemctl start valheim
echo "Done!"
