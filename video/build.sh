#!/usr/bin/env bash
# Builds the TaskTimer guide video from the real app:
#   1. starts a throwaway copy of the app with an empty database
#   2. seeds demo data and records every UI state with Playwright
#   3. renders the motion-graphics composition frame by frame
#   4. encodes the frames to an MP4 (1080p, no sound)
#
# Requirements: Node 18+, Playwright with Chromium, ffmpeg.
# Usage: video/build.sh [fps] [workers]      (default 60 fps, 4 workers)
set -euo pipefail

FPS="${1:-60}"
WORKERS="${2:-4}"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
BUILD="$HERE/.build"
PORT=3001

rm -rf "$BUILD" && mkdir -p "$BUILD/app/frontend" "$BUILD/app/data/uploads" "$BUILD/comp"

# 1 — throwaway app
cp -r "$REPO/backend/." "$BUILD/app/"
cp -r "$REPO/frontend/dist" "$BUILD/app/frontend/"
(cd "$BUILD/app" && npm install --omit=dev --silent)
(cd "$BUILD/app" && JWT_SECRET=video-build-secret-0123456789abcdefghijkl DB_PATH="$BUILD/app/data/tasktimer.db" PORT=$PORT node server.js > "$BUILD/server.log" 2>&1) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -s -o /dev/null "http://localhost:$PORT/" && break; sleep 0.2; done

# 2 — demo data + capture
node "$HERE/seed.mjs"
node "$HERE/capture.cjs" "$BUILD/cap"

# 3 — composition
cp "$HERE/composition/"* "$BUILD/comp/"
cp "$REPO/backend/public/icons/logo.png" "$REPO/backend/public/icons/favicon.png" "$BUILD/comp/"
echo "window.MANIFEST=$(cat "$BUILD/cap/manifest.json");" > "$BUILD/comp/manifest.js"
DUR=$(node -e "
  const { chromium } = require('playwright');
  (async () => {
    const b = await chromium.launch(); const p = await b.newPage();
    await p.goto('file://$BUILD/comp/index.html');
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    console.log(await p.evaluate(() => TL.dur)); await b.close();
  })();
")
echo "Duration: ${DUR}s at ${FPS} fps"

# 4 — render in parallel, then encode
PIDS=()
for i in $(seq 0 $((WORKERS - 1))); do
  A=$(node -e "console.log($DUR * $i / $WORKERS)")
  B=$(node -e "console.log($DUR * ($i + 1) / $WORKERS)")
  node "$HERE/render.cjs" "$BUILD/comp" "$BUILD/frames" "$FPS" "$A" "$B" &
  PIDS+=($!)
done
for p in "${PIDS[@]}"; do wait "$p"; done

ffmpeg -y -loglevel error -framerate "$FPS" -i "$BUILD/frames/%06d.jpg" \
  -c:v libx264 -preset slow -crf 20 -tune animation -pix_fmt yuv420p -movflags +faststart \
  "$HERE/tasktimer-guide.mp4"
echo "Done: $HERE/tasktimer-guide.mp4"
