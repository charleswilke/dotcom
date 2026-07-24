#!/bin/bash
# make-card-variants.sh — regenerate the downscaled "-card" images the homepage displays.
#
# Why this exists: several images are referenced twice with different needs.
#   - og:image / twitter:image / JSON-LD want the LARGE original (>=1200px for social cards).
#   - the homepage grid only ever displays them at 274-414 CSS px.
# So the originals stay untouched and the homepage points at a ~2x "-card" copy instead.
#
# Run this after replacing any source image below (e.g. new album art), then run
# ./bump-cover.sh if you replaced a file in place. Safe to re-run any time.
#
# Requires: cwebp (brew install webp)

set -euo pipefail
cd "$(dirname "$0")"

command -v cwebp >/dev/null || { echo "error: cwebp not found (brew install webp)" >&2; exit 1; }

QUALITY=80

# src                                                            width  (max display px x2)
VARIANTS=(
  "images/ToastIQ.webp|700"
  "images/s2i-title2.webp|700"
  "images/jb/jb1.webp|760"
  "images/tootsjam.webp|760"
  "images/space-toots.webp|760"
  "images/cw4.webp|860"
  "audio/junkyard-cabaret/junkyard-cabaret-cover.webp|860"
  "audio/grief-without-ritual/grief-without-ritual-cover.webp|860"
  "audio/exploring-laibor-mixtape/exploring-laibor-side2-cover.webp|860"
)

echo "Regenerating card variants (quality ${QUALITY})..."
for entry in "${VARIANTS[@]}"; do
  src="${entry%|*}"
  width="${entry#*|}"
  out="${src%.webp}-card.webp"

  if [ ! -f "$src" ]; then
    echo "  SKIP (missing source): $src" >&2
    continue
  fi

  # Never upscale — that only adds bytes. Fall back to the source width.
  srcw=$(sips -g pixelWidth "$src" 2>/dev/null | tail -1 | tr -dc '0-9')
  if [ -n "$srcw" ] && [ "$srcw" -lt "$width" ]; then
    echo "  SKIP (source ${srcw}px already <= target ${width}px): $src"
    continue
  fi

  cwebp -quiet -q "$QUALITY" -sharp_yuv -resize "$width" 0 -m 6 "$src" -o "$out"

  # A "smaller" copy that is actually bigger means the original is already well
  # compressed; keep the original in that case rather than shipping a worse file.
  if [ "$(stat -f%z "$out")" -ge "$(stat -f%z "$src")" ]; then
    echo "  SKIP (variant not smaller than original): $src"
    rm -f "$out"
    continue
  fi

  printf "  %-62s %6sKB -> %6sKB\n" "$(basename "$out")" \
    "$(( $(stat -f%z "$src") / 1024 ))" "$(( $(stat -f%z "$out") / 1024 ))"
done

# The article-reader byline avatar renders at 40px; it does not need the card size.
if [ -f images/cw4.webp ]; then
  cwebp -quiet -q "$QUALITY" -sharp_yuv -resize 120 0 -m 6 images/cw4.webp -o images/cw4-avatar.webp
  printf "  %-62s %6sKB\n" "cw4-avatar.webp" "$(( $(stat -f%z images/cw4-avatar.webp) / 1024 ))"
fi

echo "Done. Originals were not modified (og:image and lightboxes still use them)."
