#!/bin/sh
set -u

echo "=== Start Cleanup of Legacy Files ==="
if [ -d "/app_root/app" ]; then
    echo "Found old 'app' folder. Removing..."
    rm -rf /app_root/app
fi
if [ -f "/app_root/nginx.conf" ]; then
    echo "Found old 'nginx' file. Removing..."
    rm -f /app_root/nginx.conf
fi
if [ -d "/app_root/img" ]; then
    echo "Found old 'img' folder. Removing..."
    rm -rf /app_root/img
fi
echo "=== Cleanup Complete ==="

echo "Preparing start.sh for the nervad container..."
cp -f /app/start.sh /data/nerva/start.sh
chmod +x /data/nerva/start.sh

echo "Starting Node.js API backend..."
node /app/server.js &

echo "Starting Nerva downloader script..."
/bin/sh /app/download.sh &

echo "Starting Nginx frontend proxy..."
exec nginx -g "daemon off;"