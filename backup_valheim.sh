#!/bin/bash
set -e

WORLDS=/home/steam/.config/unity3d/IronGate/Valheim/worlds_local
BACKUPS=/home/lukas/valheim-backups
STAMP=$(date +%d.%m.%Y_%H%M)

# Always start the server even if something fails
trap 'echo "Starting server..."; systemctl start valheim' EXIT

mkdir -p "$BACKUPS"

echo "Stopping server..."
systemctl stop valheim

echo "Copying world..."
cp -r "$WORLDS" "$BACKUPS/world-$STAMP"

echo "Backup saved to $BACKUPS/world-$STAMP"


