#!/bin/sh
set -u

cd /data/nerva || exit 1

echo "Initializing Nerva daemon environment..."

SETTINGS_FILE="settings.conf"

if [ ! -f "$SETTINGS_FILE" ]; then
    echo 'PUBLIC_RPC="false"' > "$SETTINGS_FILE"
    echo 'RPC_USER=""' >> "$SETTINGS_FILE"
    echo 'RPC_PASS=""' >> "$SETTINGS_FILE"
    echo 'TOR_TX_PROXY="false"' >> "$SETTINGS_FILE"
    echo 'PAD_TRANSACTIONS="false"' >> "$SETTINGS_FILE"
    echo 'PRUNE_BLOCKCHAIN="false"' >> "$SETTINGS_FILE"
    echo 'LIMIT_UP="2048"' >> "$SETTINGS_FILE"
    echo 'LIMIT_DOWN="8192"' >> "$SETTINGS_FILE"
fi

. ./"$SETTINGS_FILE"

DAEMON_ARGS="--non-interactive --data-dir=/data/nerva --rpc-bind-ip=0.0.0.0 --rpc-bind-port=17566 --no-igd"

if [ "$PUBLIC_RPC" = "true" ]; then
    echo "Activating public RPC and node advertising..."
    DAEMON_ARGS="$DAEMON_ARGS --confirm-external-bind --restricted-rpc --public-node"
    if [ -n "$RPC_USER" ] && [ -n "$RPC_PASS" ]; then
        echo "Applying RPC credentials..."
        DAEMON_ARGS="$DAEMON_ARGS --rpc-login $RPC_USER:$RPC_PASS"
    fi
fi

if [ "$TOR_TX_PROXY" = "true" ]; then
    echo "Activating Tor transaction proxy and disabling analytics..."
    DAEMON_ARGS="$DAEMON_ARGS --tx-proxy tor,10.21.21.1:9050,100 --no-analytics"
fi

if [ "$PAD_TRANSACTIONS" = "true" ]; then
    echo "Activating transaction padding..."
    DAEMON_ARGS="$DAEMON_ARGS --pad-transactions"
fi

if [ "$PRUNE_BLOCKCHAIN" = "true" ]; then
    echo "Activating blockchain pruning..."
    DAEMON_ARGS="$DAEMON_ARGS --prune-blockchain --sync-pruned-blocks"
fi

echo "Setting bandwidth limits..."
DAEMON_ARGS="$DAEMON_ARGS --limit-rate-up $LIMIT_UP --limit-rate-down $LIMIT_DOWN"

echo "Launching nervad..."
exec nervad $DAEMON_ARGS