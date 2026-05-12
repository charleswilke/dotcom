#!/bin/bash
# Bump the cache-busting version on a cover image so browsers refetch it.
#
# Background: vercel.json serves /audio/**/*.webp with `Cache-Control: immutable,
# max-age=31536000`. When a cover file is replaced in place (same filename),
# browsers and CDNs will serve the old version for up to a year. Appending
# ?v=YYYYMMDD to every HTML reference forces a fresh fetch.
#
# Usage:
#   ./bump-cover.sh <cover-filename> [version]
#   ./bump-cover.sh junkyard-cabaret-cover.webp
#   ./bump-cover.sh grief-without-ritual-cover.webp 20260512
#
# Default version is today's date (YYYYMMDD). The script updates every HTML
# reference (img src, og:image, twitter:image, JSON-LD image, etc.) in the repo.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <cover-filename> [version]"
  echo "Example: $0 junkyard-cabaret-cover.webp"
  exit 1
fi

FILE="$1"
VERSION="${2:-$(date +%Y%m%d)}"

cd "$(dirname "$0")"

MATCHES=$(grep -rl --include="*.html" -- "$FILE" . || true)

if [ -z "$MATCHES" ]; then
  echo "No HTML references to $FILE found."
  exit 1
fi

echo "Bumping $FILE to ?v=$VERSION in:"
echo "$MATCHES" | while IFS= read -r f; do
  FILE="$FILE" VERSION="$VERSION" perl -i -pe \
    's{\Q$ENV{FILE}\E(\?v=\d+)?}{$ENV{FILE}?v=$ENV{VERSION}}g' "$f"
  echo "  $f"
done

echo ""
echo "Done. Review with 'git diff', commit, and push to deploy."
