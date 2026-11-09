#!/bin/sh
# Rebuild "One Day at a Local Shop": sh build.sh   (re-renders the reused chapters from their projects first)
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"; mkdir -p "$HERE/out"
sh "$HERE/tools/excerpts.sh"
for c in glass cartoon2 iso lantern; do mkdir -p "$HERE/clips/$c" && rm -f "$HERE/clips/$c"/n_*.jpg && ffmpeg -v error -y -i "$HERE/clips/$c.mp4" -q:v 3 "$HERE/clips/$c/n_%04d.jpg"; done
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines.json" "$HERE/voices" --model small.en
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
node -e "import('$HERE/timeline.js').then(m=>console.log(JSON.stringify(m.VO.map(v=>({t0:v.t,t1:v.t1,text:v.text})))))" > "$HERE/out/srt.json"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/shop-day-styles.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/shop-day-styles.mp4" 24 0
node core/render/still.mjs "$HERE" 61 $SZ --q nosub=1 --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_61.jpg" "$HERE/poster.jpg"
