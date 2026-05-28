#!/bin/sh
set -u

echo "Preparing start.sh for the nervad container..."
cp /app/start.sh /data/nerva/start.sh
chmod +x /data/nerva/start.sh

echo "Starting Node.js API backend..."
node /app/server.js &

echo "Starting Nerva downloader script..."
/bin/sh /app/download.sh &

echo "Starting Nginx frontend proxy..."
exec nginx -g "daemon off;"