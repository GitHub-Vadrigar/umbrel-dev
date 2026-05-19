#!/bin/sh

# Standaard argumenten voor de Nerva daemon
ARGS="--p2p-bind-ip=0.0.0.0 --p2p-bind-port=17565 --rpc-bind-ip=0.0.0.0 --rpc-bind-port=17566 --non-interactive --confirm-external-bind --data-dir=/data/nerva --log-level 0"

echo "Controleren op extra configuraties..."

# 1. Quicksync Check
if [ -f "/data/nerva/quicksync.raw" ]; then
    echo "-> Quicksync bestand gevonden. Wordt toegevoegd aan opstart."
    ARGS="$ARGS --quicksync /data/nerva/quicksync.raw"
fi

# 2. Tor Integratie Check
if [ -f "/data/nerva/tor_enabled.flag" ]; then
    echo "-> Tor vlag gevonden. Outbound proxy wordt ingesteld."
    ARGS="$ARGS --proxy 10.21.21.1:9050"
fi

# Hier is nu alle ruimte voor toekomstige features!
# Voorbeeld:
# if [ -f "/data/nerva/feature_x.flag" ]; then
#     ARGS="$ARGS --extra-feature"
# fi

echo "Starten van Nerva daemon met argumenten: $ARGS"
exec nervad $ARGS