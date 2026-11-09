#!/bin/sh
# Re-render the reused chapters from their own projects (captions off) and cut the glass chapter from the spinner film.
set -e
LIB=${LIB:-/root/lemo-opuscar}; V=$(cd "$(dirname "$0")/../.." && pwd); C="$V/shop-day-styles/clips"; mkdir -p "$C"
ex() { # project t0 t1 query size name
  rm -rf "$C/$6"; mkdir -p "$C/$6"
  (cd "$LIB" && node core/render/still.mjs "$V/$1" --range "$2:$3:0.0416667" --q "$4" --size "$5" --out "$C/$6" --prefix f_ >/dev/null)
  ls "$C/$6"/f_*.jpg | sort -t_ -k2 -g | awk '{printf "file %c%s%c\nduration 0.0416667\n", 39, $0, 39}' > "$C/$6/list.txt"
  ffmpeg -v error -y -f concat -safe 0 -i "$C/$6/list.txt" -vf "fps=24,format=yuv420p" -c:v libx264 -crf 16 "$C/$6.mp4"; echo "$6 $(ls "$C/$6"/f_*.jpg | wc -l) frames"
}
ex pawansetu-explainer 26.6 33.1 nosubs=1 1080x1920 cartoon2
ex pawansetu-local-shops 21.6 27.6 nosub=1 1080x1920 iso
ex pawansetu-diwali 0.0 5.9 nosub=1 1080x1920 lantern
ffmpeg -v error -y -ss 4.8 -t 6.5 -i "$V/spinner-glass/spinner-glass.mp4" -an -vf "fps=24,format=yuv420p" -c:v libx264 -crf 16 "$C/glass.mp4"; echo glass ok
