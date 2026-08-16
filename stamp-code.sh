#!/bin/bash
# Stamp every local .css/.js reference in *.html with a hash of that file's
# contents, so the URL changes exactly when the file does.
#
# Why this exists: vercel.json serves .css and .js with
# `Cache-Control: immutable, max-age=31536000`, the same as images and audio.
# That is only safe because the ?v= on every reference changes whenever the
# file changes. Timestamps had to be bumped by hand and drifted — main.js sat
# at ?v=202608052135 while its contents had moved on ten days — which under
# `immutable` would pin returning visitors to a stale script for a year.
#
# A content hash removes the discipline from the loop. Run this before every
# deploy that touches CSS or JS:
#
#   ./stamp-code.sh            # rewrite stamps, report what moved
#   ./stamp-code.sh --check    # exit 1 if any stamp is stale, change nothing
#
# It is idempotent: with no content change it produces no diff, so it is safe
# to run every time (and in CI via --check).
#
# Scope note: this handles code (.css/.js referenced from HTML). For images,
# audio and video replaced in place, use ./bump-cover.sh instead — those are
# referenced from JS playlist data and OG tags too, which this does not touch.

set -euo pipefail

cd "$(dirname "$0")"

CHECK_ONLY=0
if [ "${1:-}" = "--check" ]; then
  CHECK_ONLY=1
elif [ $# -gt 0 ]; then
  echo "Usage: $0 [--check]" >&2
  exit 1
fi

# Every local .css/.js referenced from an HTML file, as a bare basename.
# Absolute ("/nav.js") and relative ("main.js") refs both reduce to the same
# file, and the leading slash is preserved by the rewrite below.
REFS=$(grep -ohE '(href|src)="/?[A-Za-z0-9._-]+\.(css|js)(\?v=[A-Za-z0-9]+)?"' -- *.html \
  | sed -E 's/^(href|src)="\/?//; s/(\?v=[A-Za-z0-9]+)?"$//' \
  | sort -u)

if [ -z "$REFS" ]; then
  echo "No local .css/.js references found in *.html." >&2
  exit 1
fi

STALE=0
CHANGED=0

for FILE in $REFS; do
  if [ ! -f "$FILE" ]; then
    echo "  ! $FILE referenced but not on disk — skipping" >&2
    continue
  fi

  HASH=$(shasum -a 256 "$FILE" | cut -c1-8)

  # Which HTML files point at this asset, and what stamp do they carry now?
  # The (?<![A-Za-z0-9._-]) guard keeps "before-times.js" from also matching
  # inside "before-times-archive.js".
  HOLDERS=$(grep -lE "(href|src)=\"/?${FILE//./\\.}(\?v=[A-Za-z0-9]+)?\"" -- *.html || true)
  [ -z "$HOLDERS" ] && continue

  CURRENT=$(printf '%s\n' "$HOLDERS" | while IFS= read -r h; do
    grep -ohE "${FILE//./\\.}\?v=[A-Za-z0-9]+" "$h" 2>/dev/null | sed -E 's/.*\?v=//'
  done | sort -u | tr '\n' ' ' | sed 's/ $//')

  if [ "$CURRENT" = "$HASH" ]; then
    continue
  fi

  STALE=$((STALE + 1))

  if [ "$CHECK_ONLY" = "1" ]; then
    echo "  stale  $FILE  (refs say '${CURRENT:-none}', contents hash to $HASH)"
    continue
  fi

  printf '%s\n' "$HOLDERS" | while IFS= read -r h; do
    FILE="$FILE" HASH="$HASH" perl -i -pe \
      's{(?<![A-Za-z0-9._-])\Q$ENV{FILE}\E(\?v=[A-Za-z0-9]+)?(?=")}{$ENV{FILE}?v=$ENV{HASH}}g' "$h"
  done
  echo "  $FILE -> ?v=$HASH  (${CURRENT:-unstamped})"
  CHANGED=$((CHANGED + 1))
done

echo ""
if [ "$CHECK_ONLY" = "1" ]; then
  if [ "$STALE" -gt 0 ]; then
    echo "$STALE file(s) have stale cache stamps. Run ./stamp-code.sh before deploying."
    exit 1
  fi
  echo "All cache stamps match file contents."
  exit 0
fi

if [ "$CHANGED" = "0" ]; then
  echo "All cache stamps already match file contents. Nothing to do."
else
  echo "Done. Review with 'git diff', commit, and push to deploy."
fi
