#!/usr/bin/env bash
# Polls origin/main and rebuilds the weather-kiosk Docker app when new commits arrive.
# Designed to be run by launchd (see deploy/launchd/cc.dukestv.weather-kiosk-deploy.plist).
# Idempotent: silent when there's nothing to do.

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Projects/weather-kiosk}"
BRANCH="${BRANCH:-main}"
LOG_DIR="$REPO_DIR/.auto-deploy"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/auto-deploy.log"

# Rotate log if > 1MB
if [ -f "$LOG" ] && [ "$(wc -c <"$LOG")" -gt 1048576 ]; then
    mv "$LOG" "$LOG.1"
fi

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

cd "$REPO_DIR"

# launchd's PATH is minimal — make sure git/docker are findable
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

git fetch --quiet origin "$BRANCH"
LOCAL=$(git rev-parse "$BRANCH")
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

log "new commit detected: ${LOCAL:0:7} -> ${REMOTE:0:7} — deploying"

if ! git pull --ff-only origin "$BRANCH" >> "$LOG" 2>&1; then
    log "ERROR: git pull --ff-only failed (working tree dirty or non-FF history?)"
    exit 1
fi

if docker compose up -d --build app >> "$LOG" 2>&1; then
    log "deploy succeeded — now at $(git rev-parse --short HEAD)"
else
    log "ERROR: docker compose up failed"
    exit 1
fi
