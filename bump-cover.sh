#!/bin/bash
# Bump the cache-busting version on an asset (image, audio, video) so browsers
# refetch it.
#
# Background: vercel.json serves /audio/**/*, /images/**/*, /games/**/* and all
# .webp/.png/.jpg/.jpeg/.gif/.ico/.mp3/.mp4/.mov files with `Cache-Control:
# immutable, max-age=31536000`. When a file is replaced in place (same
# filename), browsers and CDNs will serve the old version for up to a year.
# Appending ?v=YYYYMMDDHHMM to every reference forces a fresh fetch.
#
# Usage:
#   ./bump-cover.sh <filename> [version]
#   ./bump-cover.sh junkyard-cabaret-cover.webp
#   ./bump-cover.sh the-new-survivalism.mp3
#   ./bump-cover.sh grief-without-ritual-cover.webp 20260512
#
# Default version is a minute-precision timestamp (YYYYMMDDHHMM). The script
# updates every reference across *.html, *.js, and *.css — covering OG tags,
# JSON-LD, img src, audio/video src, and JS playlist data.
#
# The existing query string ?v=... (digits or alphanumeric, e.g. 20260523a) is
# replaced in place rather than appended twice.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <filename> [version]"
  echo "Examples:"
  echo "  $0 junkyard-cabaret-cover.webp"
  echo "  $0 the-new-survivalism.mp3"
  exit 1
fi

FILE="$1"
# Default to minute precision so same-day re-stamps always produce a fresh value
# (a date-only default would no-op if you bump twice in one day).
VERSION="${2:-$(date +%Y%m%d%H%M)}"

cd "$(dirname "$0")"

MATCHES=$(grep -rl \
  --include="*.html" \
  --include="*.js" \
  --include="*.css" \
  -- "$FILE" . || true)

if [ -z "$MATCHES" ]; then
  echo "No references to $FILE found in *.html / *.js / *.css."
  exit 1
fi

echo "Bumping $FILE to ?v=$VERSION in:"
echo "$MATCHES" | while IFS= read -r f; do
  FILE="$FILE" VERSION="$VERSION" perl -i -pe \
    's{\Q$ENV{FILE}\E(\?v=[\w]+)?}{$ENV{FILE}?v=$ENV{VERSION}}g' "$f"
  echo "  $f"
done

echo ""
echo "Done. Review with 'git diff', commit, and push to deploy."
