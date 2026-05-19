#!/bin/sh
cd /data/nerva || exit 1

echo "Receiving hashes.txt..."
wget -qO hashes.txt https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/hashes.txt

check_and_download() {
  FILE="$1"
  URL="$2"

  EXPECTED_HASH=$(grep "$FILE" hashes.txt | awk '{print $1}')
  
  if [ -z "$EXPECTED_HASH" ]; then
    echo "ERROR: No hash found for $FILE in hashes.txt"
    return 1
  fi

  if [ -f "$FILE" ]; then
    LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
    if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
      echo "Update found or corruption in $FILE. Deleting..."
      rm "$FILE"
    else
      echo "$FILE is up-to-date and verified."
      return 0
    fi
  fi
  
  echo "Downloading $FILE..."
  wget -qO "$FILE" "$URL"
  
  LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
  if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
    echo "ERROR: Hash does not match for $FILE after download. File will be deleted."
    rm "$FILE"
    return 1
  else
    echo "Succes: $FILE verified."
    return 0
  fi
}

check_and_download 'quicksync.raw' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/quicksync.raw'
check_and_download 'p2pstate.nerva.v11.bin' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/p2pstate.nerva.v11.bin'

exit 0