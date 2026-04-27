#!/usr/bin/env bash
# Polls origin/main and rebuilds the weather-kiosk Docker app when the running
# image falls behind HEAD. Designed to run from launchd (see
# deploy/launchd/cc.dukestv.weather-kiosk-deploy.plist).
#
# Idempotent: silent when last-deployed SHA matches HEAD and HEAD matches origin.
# Bootstrap-safe: if .auto-deploy/last-deployed-sha is missing or stale, will
# rebuild on next run even when there are no new git commits to pull.

set -euo pipefail

REPO_DIR="${REPO_DIR:-$HOME/Projects/weather-kiosk}"
BRANCH="${BRANCH:-main}"
STATE_DIR="$REPO_DIR/.auto-deploy"
LOG="$STATE_DIR/auto-deploy.log"
LAST_DEPLOYED_FILE="$STATE_DIR/last-deployed-sha"

mkdir -p "$STATE_DIR"

# Rotate log if > 1MB
if [ -f "$LOG" ] && [ "$(wc -c <"$LOG")" -gt 1048576 ]; then
    mv "$LOG" "$LOG.1"
fi

ts() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

cd "$REPO_DIR"

# launchd's PATH is minimal — make sure git/docker are findable
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

# Pull if behind origin
git fetch --quiet origin "$BRANCH"
LOCAL=$(git rev-parse "$BRANCH")
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" != "$REMOTE" ]; then
    log "pulling ${LOCAL:0:7} -> ${REMOTE:0:7}"
    if ! git pull --ff-only origin "$BRANCH" >> "$LOG" 2>&1; then
        log "ERROR: git pull --ff-only failed (working tree dirty or non-FF history?)"
        exit 1
    fi
fi

# Compare HEAD against last-deployed SHA. This catches the bootstrap case where
# the repo is already at HEAD but the running container was built from an older
# commit (or no record exists yet).
HEAD_SHA=$(git rev-parse HEAD)
LAST_DEPLOYED=""
[ -f "$LAST_DEPLOYED_FILE" ] && LAST_DEPLOYED=$(cat "$LAST_DEPLOYED_FILE")

if [ "$HEAD_SHA" = "$LAST_DEPLOYED" ]; then
    exit 0
fi

if [ -z "$LAST_DEPLOYED" ]; then
    log "no last-deployed record — bootstrapping rebuild at ${HEAD_SHA:0:7}"
else
    log "deploying ${LAST_DEPLOYED:0:7} -> ${HEAD_SHA:0:7}"
fi

if docker compose up -d --build app >> "$LOG" 2>&1; then
    echo "$HEAD_SHA" > "$LAST_DEPLOYED_FILE"
    log "deploy succeeded — now at ${HEAD_SHA:0:7}"
else
    log "ERROR: docker compose up failed"
    exit 1
fi
