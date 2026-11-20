#!/usr/bin/env bash
# Render individual frames for review: scripts/stills.sh OUTDIR frame1 frame2 ...
set -e
OUT=$1; shift
B=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
mkdir -p "$OUT"
for fr in "$@"; do
  npx remotion still src/index.ts NutcrackerDream "$OUT/f$(printf %03d $fr).jpg" --frame=$fr --image-format=jpeg --scale=0.5 --browser-executable="$B" --log=error &
done
wait
