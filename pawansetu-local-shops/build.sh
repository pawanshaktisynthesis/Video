#!/bin/sh
# Rebuild "PawanSetu — Two Streets Away" from scratch: sh build.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"
# 1. voice (edge-tts, en-IN-NeerjaNeural; the wrapper points edge-tts at SSL_CERT_FILE when set) + whisper check
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines.json" "$HERE/voices" --model small.en
# 2. score, events, mix
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $SZ
"$PY" "$HERE/mix.py"
# 3. subtitles
node -e "import('$HERE/timeline.js').then(m=>console.log(JSON.stringify(m.SUBS.map(s=>({t0:s.t0,t1:s.t1,text:s.text})))))" > "$HERE/out/srt.json"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/pawansetu-local-shops.srt"
# 4. picture → mux (−14 LUFS, no grain on a flat vector style)
node core/render/video.mjs "$HERE" --fps 24 --workers 3 $SZ --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/pawansetu-local-shops.mp4" 24 0
node core/render/still.mjs "$HERE" 38.9 $SZ --q nosub=1 --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_38.9.jpg" "$HERE/poster.jpg"
