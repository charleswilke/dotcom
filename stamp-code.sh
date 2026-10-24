#!/bin/bash
# Stamp local CSS/JS references in every served HTML entry, including games and
# generated share pages. Deploy builds do this automatically after minification.
set -euo pipefail
cd "$(dirname "$0")"
exec node tools/stamp-assets.js "$@"
