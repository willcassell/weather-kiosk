# Weather Kiosk

Real-time weather monitoring dashboard for WeatherFlow Tempest stations with Ecobee thermostat integration, designed for continuous kiosk display.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query
- **Backend**: Express + Drizzle ORM + PostgreSQL (MemStorage fallback)
- **Testing**: Vitest (45 tests across 5 files)
- **Deploy**: Cloudflare Tunnel, DakBoard iframe compatible

## Current State
- All features working: weather data, thermostat, lightning detection, radar, NOAA alerts
- `npm test` — 45 passing | `npm run check` — clean | `npm run build` — clean
- 15 production dependency vulnerabilities (intentionally deferred)
- Live at https://weather.dukestv.cc

## Recent Changes
- 2026-04-27: Typography pass — split-decimal superscripts on all temps + humidity (e.g. `67` big + `.5°F` small sup), bigger/bolder daily high/low (14px med → 20px bold), centered big current-temp in thermostat zone cards with viewport-clamped sizing `clamp(24px,4.2vh,38px)`
- 2026-04-26: Indoor Climate overhaul — fit 720p viewport, clear zone hierarchy, delta status, explicit Target labels, lucide icons
- 2026-04-26: Complete lightning detection overhaul (time-based active state, severity colors, shared helpers)
- 2026-04-26: Backend lightning: 3-hour window, no distance requirement, WeatherFlow forecast fields preferred
- 2026-04-26: Radar fallback overlay ("Live radar temporarily unavailable" with glass morphism)
- 2026-04-26: Layout polish: glass morphism cards, thermostat grid simplification, wind/rainfall cleanup
- 2026-04-26: Fix TypeScript check (crypto import, thermostat null types)
- 2026-04-26: Make station_pressure optional in WeatherFlowObsDataSchema
- 2026-04-26: Add comprehensive lightning + schema tests (17 new tests)

## Lessons
- **WeatherFlow has separate schemas for obs vs forecast** — `station_pressure` was optional in CurrentConditions but required in ObsData. Both need to tolerate missing fields independently
- **Lightning distance is unreliable** — Strike count/time can exist without distance. Never gate lightning detection on distance presence
- **Cross-origin iframe errors are unreliable** — Windy radar embed won't fire `onerror` consistently. Use a 12s timeout fallback instead
- **Don't use generic card centering for complex content** — `weather-card-content` with `items-center justify-center` works for simple metrics but breaks for multi-zone thermostat cards. Use content-specific layout classes instead
- **Flex ratios must be viewport-tested** — `flex-[2.3]` looked fine at 1080p but clipped at 720p. Always verify kiosk layouts at the actual target resolution
- **`TemperatureDisplay` is the single source of truth for all temp rendering** — every °F on the dashboard goes through it. Change formatting once there and it ripples through current temp, feels-like, high/low, dew point, and both thermostat zones. Don't reintroduce inline `toFixed(1)` calls in cards
- **Use `text-[clamp(min, vh, max)]` for kiosk-prominent values, not fixed px** — fixed sizes look great at one viewport and wrong at the other. Vh-based clamps absorb the 720p ↔ 1080p gap automatically. Prefer `vh` over `vw` because the kiosk is height-constrained
- **The dashboard's flex column overflows ~65px at 720p even on baseline** — sum of card content exceeds the available height. The bottom of indoor-climate cards has been clipped on production all along. Don't blame layout regressions on changes without measuring scrollHeight vs clientHeight on the section first

## Next Steps
- Dependency audit (15 vulnerabilities, including 8 high severity)
- Pressure gauge marker/spacing polish
- Consider sharing `LIGHTNING_RECENT_HOURS` constant between server and client via shared/lightning.ts
