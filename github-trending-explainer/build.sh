#!/bin/sh
# Rebuild "This Week on GitHub" from scratch: sh build.sh
set -e
LIB=${LIB:-/root/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
PY="$LIB/.venv/bin/python"; mkdir -p "$HERE/out"
"$PY" "$HERE/tools/tts_proxy.py" "$LIB/core/tts/tts_zh.py" "$HERE/lines.json" "$HERE/voices"
"$PY" "$LIB/core/tts/asr_check.py" "$HERE/lines.json" "$HERE/voices" --model small.en
"$PY" "$HERE/tools/make_timeline.py"
"$PY" "$HERE/music/score.py"
cd "$LIB"
node core/render/events.mjs "$HERE"
"$PY" "$HERE/mix.py"
"$PY" -c "import json;tl=json.load(open('$HERE/timeline.json'));json.dump([{'t0':v['t'],'t1':v['t1'],'text':v['text']} for v in tl['vo']],open('$HERE/out/srt.json','w'))"
"$PY" core/render/srt.py "$HERE/out/srt.json" "$HERE/github-trending-explainer.srt"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/mix.wav" "$HERE/github-trending-explainer.mp4" 24 0
node core/render/still.mjs "$HERE" 12 --q nosub=1 --out "$HERE/out/still" --prefix po_ >/dev/null && cp "$HERE/out/still/po_12.jpg" "$HERE/poster.jpg"
