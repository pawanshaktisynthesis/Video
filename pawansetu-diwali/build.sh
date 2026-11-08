#!/bin/sh
# Rebuild "PawanSetu — One Small Light" (Happy Diwali) from scratch: sh build.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"; mkdir -p "$HERE/out"
# 1. voice (edge-tts en-IN-NeerjaNeural; the wrapper points edge-tts at SSL_CERT_FILE when set) + whisper check
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines.json" "$HERE/voices" --model small.en
# 2. score, events, mix
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
# 3. subtitles (the final greeting is paper, not subtitled)
node -e "import('$HERE/timeline.js').then(m=>console.log(JSON.stringify(m.SUBS.map(s=>({t0:s.t0,t1:s.t1,text:s.text})))))" > "$HERE/out/srt.json"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/pawansetu-diwali.srt"
# 4. picture at 30 fps → mux (−14 LUFS, light grain)
node core/render/video.mjs "$HERE" --fps 30 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/pawansetu-diwali.mp4" 30 0
node core/render/still.mjs "$HERE" 39.8 $SZ --q nosub=1 --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_39.8.jpg" "$HERE/poster.jpg"
