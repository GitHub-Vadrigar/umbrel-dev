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
	echo 'PRIORITY_NODE=""' >> "$SETTINGS_FILE"
	echo 'EXCLUSIVE_NODE=""' >> "$SETTINGS_FILE"
	echo 'LOG_LEVEL="0"' >> "$SETTINGS_FILE"
	echo 'DISABLE_UPNP="false"' > "$SETTINGS_FILE"
	echo 'HIDE_PORT="false"' > "$SETTINGS_FILE"
fi

. ./"$SETTINGS_FILE"

DAEMON_ARGS="--p2p-bind-ip=0.0.0.0 --p2p-bind-port=17565 --rpc-bind-ip=0.0.0.0 --rpc-bind-port=17566 --non-interactive --confirm-external-bind --data-dir=/data/nerva"

if [ "${USE_QUICKSYNC:-false}" = "true" ] && [ -f "/data/nerva/quicksync.raw" ]; then
    echo "QuickSync enabled."
    DAEMON_ARGS="$DAEMON_ARGS --quicksync /data/nerva/quicksync.raw"
fi

if [ -n "${PRIORITY_NODE:-}" ]; then
    echo "Priority node set to $PRIORITY_NODE"
    DAEMON_ARGS="$DAEMON_ARGS --add-priority-node $PRIORITY_NODE"
fi

if [ -n "${EXCLUSIVE_NODE:-}" ]; then
    echo "Priority node set to $EXCLUSIVE_NODE"
    DAEMON_ARGS="$DAEMON_ARGS --add-exclusive-node $EXCLUSIVE_NODE"
fi

if [ -n "${LOG_LEVEL:-}" ]; then
    echo "Log level set to $LOG_LEVEL"
    DAEMON_ARGS="$DAEMON_ARGS --log-level $LOG_LEVEL"
fi

if [ "${DISABLE_UPNP:-false}" = "true" ]; then
    echo "UPnP port mapping disabled."
    DAEMON_ARGS="$DAEMON_ARGS --no-igd"
fi

if [ "${NO_ANALYTICS:-false}" = "true" ]; then
    echo "Analytics disabled."
    DAEMON_ARGS="$DAEMON_ARGS --no-analytics"
fi

if [ "${HIDE_PORT:-false}" = "true" ]; then
    echo "Do not show up as peerlist candidate."
    DAEMON_ARGS="$DAEMON_ARGS --hide-my-port"
fi

echo "Launching nerva daemon..."
exec nervad $DAEMON_ARGS