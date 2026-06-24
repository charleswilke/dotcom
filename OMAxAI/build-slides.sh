#!/usr/bin/env bash
#
# build-slides.sh — rasterize a presentation PDF into web-optimized WebP slides
# for the full-screen viewer at /s2i.
#
# Usage:
#   ./build-slides.sh WIP/S2I-WIP3.pdf        # default: 1600px tall, quality 82
#   ./build-slides.sh WIP/S2I-WIP3.pdf 2000 85
#
# Requires: pdftoppm (poppler), cwebp (webp).
# Output:   viewer/slides/01.webp ... NN.webp  (overwrites previous run)

set -euo pipefail

PDF="${1:?Usage: ./build-slides.sh <pdf> [px-height] [quality]}"
HEIGHT="${2:-1600}"
QUALITY="${3:-82}"

DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/viewer/slides"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Rasterizing $PDF at ${HEIGHT}px tall, WebP q${QUALITY}..."
rm -rf "$OUT"
mkdir -p "$OUT"

# pdftoppm: one PNG per page, scaled to HEIGHT, zero-padded names (page-01.png...)
pdftoppm -png -scale-to-y "$HEIGHT" -scale-to-x -1 "$PDF" "$TMP/page" -f 1 -l 999

i=0
for png in "$TMP"/page-*.png; do
  i=$((i + 1))
  n=$(printf "%02d" "$i")
  cwebp -quiet -q "$QUALITY" "$png" -o "$OUT/$n.webp"
done

# Emit a manifest the viewer reads: page count + a build stamp the viewer
# appends as ?v= to bust the year-long immutable cache on re-export.
COUNT=$i
BUILD="$(date +%Y%m%d%H%M)"
{
  echo "{"
  echo "  \"count\": $COUNT,"
  echo "  \"build\": \"$BUILD\","
  echo "  \"source\": \"$(basename "$PDF")\""
  echo "}"
} > "$OUT/manifest.json"

TOTAL=$(du -sh "$OUT" | cut -f1)
echo "Done: $COUNT slides -> $OUT ($TOTAL total)"
