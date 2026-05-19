#!/bin/sh
cd /data/nerva || exit 1

echo "Ophalen hashes.txt..."
wget -qO hashes.txt https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/hashes.txt

check_and_download() {
  FILE="$1"
  URL="$2"
  
  # Zoek de verwachte hash op in het bestand
  EXPECTED_HASH=$(grep "$FILE" hashes.txt | awk '{print $1}')
  
  if [ -z "$EXPECTED_HASH" ]; then
    echo "FOUT: Geen hash gevonden voor $FILE in hashes.txt"
    return 1
  fi

  if [ -f "$FILE" ]; then
    LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
    if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
      echo "Update gevonden of corruptie in $FILE. Verwijderen..."
      rm "$FILE"
    else
      echo "$FILE is up-to-date en geverifieerd."
      return 0
    fi
  fi
  
  echo "Downloaden $FILE..."
  wget -qO "$FILE" "$URL"
  
  # Hash check na download
  LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
  if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
    echo "FOUT: Hash klopt niet voor $FILE na download. Bestand wordt verwijderd."
    rm "$FILE"
    return 1
  else
    echo "Succes: $FILE geverifieerd."
    return 0
  fi
}

# Voer de checks uit
check_and_download 'quicksync.raw' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/quicksync.raw'
check_and_download 'p2pstate.nerva.v11.bin' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/p2pstate.nerva.v11.bin'

# We sluiten ALTIJD af met een succesvolle exit code 0.
# Mocht een download mislukken, dan faalt deze container niet hard,
# waardoor 'nervad' (die hier op wacht) alsnog gewoon mag starten.
exit 0