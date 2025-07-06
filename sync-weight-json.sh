#!/bin/bash

cd /home/dh_528u8k/charleswilke.com || exit 1

# Optional: pull latest changes (protects against conflicts)
git pull origin main

# Add only the JSON file
git add snuggles_weight_data.json

# Commit with a timestamp (will skip if nothing changed)
git commit -m "Auto-sync: update snuggles_weight_data.json on $(date '+%Y-%m-%d %H:%M:%S')" || exit 0

# (Optional: If using custom SSH key, uncomment next line and set your key name)
# export GIT_SSH_COMMAND='ssh -i ~/.ssh/id_github_cron -o IdentitiesOnly=yes'

git push origin main
