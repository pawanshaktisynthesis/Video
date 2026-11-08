#!/bin/sh
# Rebuild "SPIN. RESET." from scratch: sh build.sh   (WebGL; slow without a GPU)
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"; mkdir -p "$HERE/out"
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/spinner-glass.mp4" 24 0
node core/render/still.mjs "$HERE" 29.5 $SZ --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_29.5.jpg" "$HERE/poster.jpg"
