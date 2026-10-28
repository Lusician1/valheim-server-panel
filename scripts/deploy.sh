#!/bin/bash
set -e
cd /opt/valheim-panel

echo "Pulling lates code..."
git pull

echo "Installing packages"
npm ci --omit=dev

echo "Restarting panel"
sudo systemctl restart valheim-panel

echo "Deployed!"