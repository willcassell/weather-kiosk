# Auto-Deploy via launchd

Polls `origin/main` every 2 minutes on the host running the production Docker stack
(Mac Mini). When a new commit is detected, runs `git pull --ff-only` and
`docker compose up -d --build app` to rebuild the app container without touching
the Postgres or Cloudflared sidecars.

## Install

```bash
chmod +x ~/Projects/weather-kiosk/scripts/auto-deploy.sh

# Smoke test it once
~/Projects/weather-kiosk/scripts/auto-deploy.sh
tail ~/Projects/weather-kiosk/.auto-deploy/auto-deploy.log

# Install the launchd job
cp ~/Projects/weather-kiosk/deploy/launchd/cc.dukestv.weather-kiosk-deploy.plist \
   ~/Library/LaunchAgents/

launchctl load -w ~/Library/LaunchAgents/cc.dukestv.weather-kiosk-deploy.plist
launchctl list | grep weather-kiosk-deploy
```

## Disable

```bash
launchctl unload -w ~/Library/LaunchAgents/cc.dukestv.weather-kiosk-deploy.plist
```

## How it works

- The script is **idempotent and silent** — it exits cleanly when local matches origin.
- Uses `--ff-only` so it refuses to pull if the working tree has local changes; that's
  intentional, since auto-rebuilding random WIP would be unpredictable.
- Logs to `.auto-deploy/auto-deploy.log` (rotated at 1MB).
- launchd captures stdout/stderr to `.auto-deploy/launchd.out` and `.auto-deploy/launchd.err`.

## Adjusting cadence

Edit `StartInterval` in the plist (seconds), then reload:

```bash
launchctl unload ~/Library/LaunchAgents/cc.dukestv.weather-kiosk-deploy.plist
launchctl load -w ~/Library/LaunchAgents/cc.dukestv.weather-kiosk-deploy.plist
```

Sensible values: `60` (1 min), `120` (2 min, default), `300` (5 min).

## Why polling, not webhooks

Production stack runs behind Cloudflare Zero Trust Tunnels with no inbound exposure.
A webhook listener would need its own tunnel + auth and adds attack surface for
no real benefit at this scale. Polling is purely outbound and survives reboots.
