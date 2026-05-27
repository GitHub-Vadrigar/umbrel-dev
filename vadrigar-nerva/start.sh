#!/bin/sh
set -u

cd /data/nerva || exit 1

SETTINGS_FILE="settings.conf"

# Mocht het bestand om een of andere reden ontbreken, gebruik veilige defaults
if [ ! -f "$SETTINGS_FILE" ]; then
    echo 'USE_QUICKSYNC="false"' > "$SETTINGS_FILE"
fi

. ./"$SETTINGS_FILE"

DAEMON_ARGS="--p2p-bind-ip=0.0.0.0 --p2p-bind-port=17565 --rpc-bind-ip=0.0.0.0 --rpc-bind-port=17566 --non-interactive --confirm-external-bind --data-dir=/data/nerva --log-level 0"

if [ "${USE_QUICKSYNC:-false}" = "true" ] && [ -f "/data/nerva/quicksync.raw" ]; then
    echo "Quicksync geactiveerd."
    DAEMON_ARGS="$DAEMON_ARGS --quicksync /data/nerva/quicksync.raw"
fi

echo "Launching nervad..."
exec nervad $DAEMON_ARGS