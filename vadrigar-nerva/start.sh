#!/bin/sh
set -u

cd /data/nerva || exit 1

echo "Waiting for backend download process and verification to complete..."
while [ ! -f "/data/nerva/.download_complete" ]; do
    sleep 3
done

SETTINGS_FILE="settings.conf"

if [ ! -f "$SETTINGS_FILE" ]; then
    echo 'USE_QUICKSYNC="false"' > "$SETTINGS_FILE"
fi

. ./"$SETTINGS_FILE"

DAEMON_ARGS="--p2p-bind-ip=0.0.0.0 --p2p-bind-port=17565 --rpc-bind-ip=0.0.0.0 --rpc-bind-port=17566 --non-interactive --confirm-external-bind --data-dir=/data/nerva --log-level 3"

if [ "${USE_QUICKSYNC:-false}" = "true" ] && [ -f "/data/nerva/quicksync.raw" ]; then
    echo "Quicksync bootstrap enabled."
    DAEMON_ARGS="$DAEMON_ARGS --quicksync /data/nerva/quicksync.raw"
fi

echo "Launching nerva deamon..."
exec nervad $DAEMON_ARGS