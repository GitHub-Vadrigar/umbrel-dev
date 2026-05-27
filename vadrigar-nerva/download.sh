#!/bin/sh
set -u

# Reset the status file upon every container (re)start
rm -f /data/nerva/.download_complete

echo "Waiting for initialization via web interface..."
while [ ! -f /data/nerva/settings.conf ]; do
  sleep 3
done

echo "Settings found! Loading..."
. /data/nerva/settings.conf

apk update && apk add --no-cache gnupg unzip wget coreutils || exit 1

cd /data/nerva || exit 1

export GNUPGHOME=$(mktemp -d)
chmod 700 "$GNUPGHOME"

NERVA_VERSION="v0.2.2.0-rc2"
BASE_URL="https://github.com/nerva-project/nerva/releases/download/${NERVA_VERSION}"
GPG_KEY_URL="https://raw.githubusercontent.com/nerva-project/nerva/master/gpg_keys/sn1f3rt.asc"

echo "Fetching GPG key, hashes.txt, and signatures..."
wget -nv -O sn1f3rt.asc "$GPG_KEY_URL" || exit 1
wget -nv -O hashes.txt "${BASE_URL}/hashes.txt" || exit 1
wget -nv -O signatures.zip "${BASE_URL}/signatures-${NERVA_VERSION}.zip" || exit 1

echo "Importing GPG key and extracting signature..."
gpg --import sn1f3rt.asc || exit 1
unzip -j -o signatures.zip || exit 1

echo "Verifying hashes.txt..."
if ! gpg --verify hashes.txt.asc hashes.txt; then
  echo "ERROR: GPG verification of hashes.txt failed!"
  exit 1
fi
echo "Success: hashes.txt is safe and verified."

rm sn1f3rt.asc signatures.zip hashes.txt.asc
rm -rf "$GNUPGHOME"

check_and_download() {
  FILE="$1"
  URL="$2"
  MUTABLE="$3"

  EXPECTED_HASH=$(grep "$FILE" hashes.txt | awk '{print $1}')
  
  if [ -z "$EXPECTED_HASH" ]; then
    echo "ERROR: Missing hash for $FILE in hashes.txt"
    return 1
  fi

  if [ -f "$FILE" ]; then
    if [ "$MUTABLE" = "true" ]; then
      echo "Skipping hash check: $FILE is a dynamic state file."
      return 0
    fi

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
    echo "ERROR: Hash mismatch for $FILE post-download. Removing file."
    rm "$FILE"
    return 1
  else
    echo "Success: $FILE verification passed."
    return 0
  fi
}

# Check user preference before downloading quicksync
if [ "${USE_QUICKSYNC:-false}" = "true" ]; then
    echo "User enabled Quicksync. Processing dynamic blockchain bootstrap..."
    check_and_download 'quicksync.raw' "${BASE_URL}/quicksync.raw" 'false' || exit 1
else
    echo "Quicksync skipped by user preference."
    rm -f /data/nerva/quicksync.raw
fi

check_and_download 'p2pstate.nerva.v11.bin' "${BASE_URL}/p2pstate.nerva.v11.bin" 'true' || exit 1

chown -R 1000:1000 /data/nerva

echo "All downloads and verifications completed successfully."

# Signal the nervad container that assets are ready
touch /data/nerva/.download_complete

echo "Downloader entering standby to keep container active for Umbrel orchestration..."
exec tail -f /dev/null