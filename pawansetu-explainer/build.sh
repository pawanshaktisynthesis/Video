#!/bin/sh
# Rebuild "PawanSetu — Shop Local, Online" from scratch: sh build.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"; mkdir -p "$HERE/out"
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines.json" "$HERE/voices" --model small.en
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
node -e "import('$HERE/timeline.js').then(m=>console.log(JSON.stringify(m.SUBS.map(s=>({t0:s.t0,t1:s.t1,text:s.text})))))" > "$HERE/out/srt.json"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/pawansetu-explainer.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/pawansetu-explainer.mp4" 24 0
node core/render/still.mjs "$HERE" 44 $SZ --q nosubs=1 --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_44.jpg" "$HERE/poster.jpg"
