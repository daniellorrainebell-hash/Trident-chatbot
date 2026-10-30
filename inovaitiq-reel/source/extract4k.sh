#!/bin/bash
# extract.sh: turn clips/cN.mp4 into frames/cN/####.jpg at 30fps, retimed to fill its segment
set -e
declare -A LEN=([0]=9 [1]=6 [2]=9 [3]=12 [4]=8 [5]=6 [6]=10)
for c in ${ONLY:-1 2 3 4 5 6}; do
  src=clips4k/c$c.mp4; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $src)
  # slow down so the clip spans the segment, but never slower than 0.5x (hold last frame after)
  f=$(python3 -c "print(max(${LEN[$c]}/$d if ${LEN[$c]}/$d<2 else 2, 1.0) if False else min(max(${LEN[$c]}/$d,0.7),2.0))")
  rm -rf frames4k/c$c; mkdir -p frames4k/c$c
  ffmpeg -v error -i $src -vf "setpts=$f*PTS,fps=30,scale=2160:3840:force_original_aspect_ratio=increase:flags=lanczos,crop=2160:3840" -q:v 2 frames4k/c$c/%04d.jpg
  echo "c$c dur=$d stretch=$f frames=$(ls frames4k/c$c | wc -l)"
done
