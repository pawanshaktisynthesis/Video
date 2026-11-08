#!/bin/sh
# Rebuild the Hindi version (Hindi voice + subtitles, fireworks logo reveal): sh build_hi.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB FILM_LANG=hi
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; SZ="--size 1080x1920"; Q="--q lang=hi"; mkdir -p "$HERE/out"
# 1. voice (edge-tts hi-IN-SwaraNeural) + whisper check (multilingual model; Hindi spelling in Whisper is loose, hence 0.8)
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines_hi.json" "$HERE/voices_hi"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines_hi.json" "$HERE/voices_hi" --lang hi --model small --threshold 0.8
# 2. score, events, mix
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE" $Q $SZ --out "$HERE/events_hi.json"
"$PY" "$HERE/mix.py"
# 3. subtitles
node -e "globalThis.FILM_LANG='hi';import('$HERE/timeline.js').then(m=>console.log(JSON.stringify(m.SUBS.map(s=>({t0:s.t0,t1:s.t1,text:s.text})))))" > "$HERE/out/srt_hi.json"
"$PY" core/render/srt.py "$HERE/out/srt_hi.json" "$HERE/pawansetu-diwali-hi.srt"
# 4. picture → mux
node core/render/video.mjs "$HERE" $Q --fps 30 --workers 3 $SZ --out "$HERE/out/video_hi.mp4"
sh core/render/mux.sh "$HERE/out/video_hi.mp4" "$HERE/mix_hi.wav" "$HERE/pawansetu-diwali-hi.mp4" 30 0
node core/render/still.mjs "$HERE" 41.5 $SZ --q 'lang=hi&nosub=1' --out "$HERE/out/still" --prefix pohi_ >/dev/null && cp "$HERE/out/still/pohi_41.5.jpg" "$HERE/poster-hi.jpg"
