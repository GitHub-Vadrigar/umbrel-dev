#!/bin/sh
set -u

cd /data/nerva || exit 1

echo "Fetching hashes.txt..."
wget -nv -O hashes.txt https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/hashes.txt || exit 1

check_and_download() {
  FILE="$1"
  URL="$2"

  EXPECTED_HASH=$(grep "$FILE" hashes.txt | awk '{print $1}')
  
  if [ -z "$EXPECTED_HASH" ]; then
    echo "ERROR: Missing hash for $FILE in hashes.txt"
    return 1
  fi

  if [ -f "$FILE" ]; then
    LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
    if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
      echo "Update or corruption detected for $FILE. Removing file..."
      rm "$FILE"
    else
      echo "$FILE is current and verified."
      return 0
    fi
  fi
  
  echo "Downloading $FILE..."
  wget -nv -O "$FILE" "$URL"
  
  LOCAL_HASH=$(sha256sum "$FILE" | awk '{print $1}')
  if [ "$LOCAL_HASH" != "$EXPECTED_HASH" ]; then
    echo "ERROR: Hash mismatch for $FILE post-download. File will be removed."
    rm "$FILE"
    return 1
  else
    echo "Success: $FILE verification passed."
    return 0
  fi
}

check_and_download 'quicksync.raw' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/quicksync.raw' || exit 1
check_and_download 'p2pstate.nerva.v11.bin' 'https://github.com/nerva-project/nerva/releases/download/v0.2.1.0/p2pstate.nerva.v11.bin' || exit 1

echo "All downloads and verifications completed successfully."
exit 0