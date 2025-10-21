# LLM README: Weather Kiosk Codebase

## Project Identity
**Name:** WeatherFlow Tempest Weather Kiosk
**Type:** Full-stack TypeScript weather monitoring application
**Purpose:** Continuous kiosk display for real-time weather data from WeatherFlow Tempest station with optional thermostat integration
**Architecture:** Monorepo with shared types, API-driven data flow, dual-storage strategy (PostgreSQL + in-memory fallback)

## Recent Updates (2025-10)
- **Security Hardening**: Helmet middleware, rate limiting, secure sessions, API key sanitization
- **Timezone Fix**: Corrected daily high/low calculations for late evening hours (post-9 PM issue)
- **International Support**: Full metric/imperial unit conversion, configurable timezone (IANA)
- **DakBoard Compatibility**: CSP frame-ancestors for iframe embedding while maintaining security
- **Thermostat Persistence**: Fixed database storage for thermostat data (was cache-only)
- **Grafana Integration**: Pre-configured dashboards for weather and thermostat analytics

## Technology Stack

### Frontend
- **React 18** + TypeScript (TSX)
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing (~3.5KB, alternative to React Router)
- **TanStack Query v5** - Server state management, caching, auto-refetch
- **Tailwind CSS 3** - Utility-first styling with custom theme
- **shadcn/ui** - Component library (50+ components) built on Radix UI primitives
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **React Hook Form + Zod** - Form validation

### Backend
- **Node.js** + **Express.js**
- **TypeScript** with ESM modules
- **Drizzle ORM** - Type-safe, lightweight database layer
- **PostgreSQL 16** - Primary storage with in-memory fallback
- **Passport.js** - Session management
- **Connect-pg-simple** - PostgreSQL session store

### Infrastructure
- **Docker + Docker Compose** - Containerization
- **Cloudflare Tunnel** - Secure internet exposure (zero-trust, outbound-only)
- **Alpine Linux** - Base images for small footprint

### Third-Party APIs
- **WeatherFlow API** - Weather observations and forecasts
- **Beestat API** - Thermostat data (single endpoint optimization)
- **Ecobee API** - Alternative direct thermostat auth (OAuth2)
- **Windy.com** - Embedded weather radar iframe

## Directory Structure

```
weather-kiosk/
├── server/              # Backend Express application
│   ├── index.ts        # Express setup, middleware, server init
│   ├── routes.ts       # API endpoints (180+ lines, main business logic)
│   ├── db.ts           # Drizzle ORM + PostgreSQL connection pool
│   ├── db-init.ts      # Database initialization & table creation
│   ├── storage.ts      # Data access layer (PostgreSQL & in-memory)
│   ├── beestat-api.ts  # Beestat thermostat integration
│   ├── ecobee-api.ts   # Ecobee OAuth & API (alternative)
│   └── vite.ts         # Vite dev server integration
│
├── client/             # React frontend
│   ├── src/
│   │   ├── App.tsx             # Route definitions (Wouter)
│   │   ├── main.tsx            # React entry point
│   │   ├── pages/
│   │   │   ├── weather-dashboard.tsx  # Main kiosk display (central hub)
│   │   │   ├── thermostat-auth.tsx    # Ecobee OAuth flow
│   │   │   └── not-found.tsx
│   │   ├── components/
│   │   │   ├── weather/        # 10 weather card components
│   │   │   ├── ui/             # 50+ shadcn/ui components
│   │   │   └── auth/
│   │   ├── hooks/
│   │   │   ├── use-unit-preferences.ts  # Imperial/metric switching
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts  # TanStack Query config
│   │   │   └── utils.ts
│   │   └── utils/
│   │       └── format-values.ts  # Unit conversion & formatting
│   └── public/         # Static assets
│
├── shared/             # Shared between client/server
│   ├── schema.ts      # Drizzle table definitions + TypeScript types
│   └── units.ts       # Unit conversion functions
│
├── migrations/         # Drizzle migration files (auto-generated)
│
└── Configuration Files
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── drizzle.config.ts
    ├── tailwind.config.ts
    ├── .env.example
    ├── Dockerfile
    └── docker-compose.yml
```

## Database Schema (PostgreSQL)

### Tables

**weather_observations** - Individual raw measurements
- Purpose: Store every API observation for calculating daily extremes
- Retention: 7 days
- Key fields: `timestamp`, `temperature`, `wind_speed`, `pressure`, `humidity`, `lightning_strike_count`, etc.
- Usage: Calculate daily high/low temperatures with exact timestamps

**weather_data** - Processed/summary data
- Purpose: Aggregated current conditions with calculated values
- Retention: 48 hours
- Refresh: Every ~3 minutes
- Key fields: `temperature`, `temperatureHigh`/`Low`, `temperatureHighTime`/`LowTime`, `windDirection` (cardinal), `pressureTrend`, `lightningStrikeTime`/`Distance`

**thermostat_data** - Indoor climate data
- Purpose: Store thermostat readings from Beestat API
- Duplicate prevention: Deletes old records for same `thermostat_id` before inserting
- Key fields: `thermostatId`, `name` (location), `temperature`, `targetTemp`, `humidity`, `mode`, `hvacState`

**session** - Express session storage (production only)
- Managed by `connect-pg-simple`
- Stores encrypted user sessions

## API Endpoints (server/routes.ts)

### Weather Endpoints

**GET /api/weather/current**
- Returns: Latest weather data with daily extremes
- Caching: 2-minute in-memory cache, 3-minute refresh interval
- Fallback: Returns stale cache if API fails
- Response fields: `temperature`, `temperatureHigh`/`Low`, `temperatureHighTime`/`LowTime`, `windSpeed`/`Direction`/`Cardinal`, `pressure`/`Trend`, `humidity`, `uvIndex`, `lightningStrikeDistance`/`Time`, `rainToday`/`Yesterday`, `dewPoint`, `stale` (boolean)

**GET /api/weather/history/:hours**
- Returns: Historical weather data for last N hours (max 48)

**POST /api/weather/refresh**
- Forces refresh bypassing cache

### Thermostat Endpoints

**GET /api/thermostats/current**
- Returns: `{ thermostats[], cached: bool, stale: bool, lastUpdated: ISO string }`
- Stale threshold: >5 minutes triggers "Delayed" indicator
- Caching: 1-minute in-memory cache
- Auto-hides: If no `BEESTAT_API_KEY` configured

**POST /api/thermostats/refresh**
- Forces refresh bypassing cache

### Ecobee Authentication (Optional)

**POST /api/thermostats/auth/start**
- Initiates PIN-based OAuth flow
- Returns: PIN for user to enter at ecobee.com

**POST /api/thermostats/auth/complete**
- Completes OAuth after PIN entry
- Stores tokens in memory

**GET /api/thermostats/auth/status**
- Checks authentication status and token expiry

### Health Check

**GET /api/health**
- Returns: Server health + database connectivity status

## Key Services & Logic

### storage.ts (Data Access Layer)
**Pattern:** Factory pattern with dual implementation
- **PostgreSQLStorage:** Uses Drizzle ORM with connection pooling
- **MemStorage:** In-memory Maps with retention windows (48h for weather, 7d for observations)
- **Selection logic:** PostgreSQL if `DATABASE_URL` set, otherwise in-memory
- **Interface:** `IStorage` for consistent API across implementations

**Key methods:**
- `getLatestWeatherData()` - Latest weather summary
- `getDailyTemperatureExtremes()` - Today's high/low with timestamps
- `getRecentLightningData()` - Lightning strikes from last 30 minutes
- `saveWeatherData()` / `saveWeatherObservation()` - Store data
- `saveThermostatData()` - Store with duplicate prevention

### routes.ts (Business Logic)
**Responsibilities:**
- Coordinate between WeatherFlow API and storage layer
- Implement smart caching strategy (SimpleCache with TTL)
- Calculate daily temperature extremes from observations
- Determine pressure trends (rising/falling/steady)
- Format cardinal wind directions (N, NE, E, SE, etc.)
- Unit conversions (°C→°F, m/s→mph, mm→inches, mb→inHg, km→miles)

**Daily Temperature Calculation:**
- Timezone: Eastern (EST/EDT) - hardcoded
- DST detection: 2nd Sunday March to 1st Sunday November
- Source: Stored observations, NOT API forecast
- Timestamps: Exact time when high/low occurred

**Pressure Trend Logic:**
- Steady: Change <0.05 inHg in last hour
- Rising: Change ≥0.05 inHg and positive
- Falling: Change ≥0.05 inHg and negative

### beestat-api.ts (Thermostat Integration)
**Optimization:** Single API endpoint call to `api.beestat.io`
- Endpoint: `?api_key={KEY}&resource=thermostat&method=read_id`
- Returns: ALL thermostat data in one call (current temp, humidity, setpoints, running equipment, properties)

**HVAC Mode Inference (priority order):**
1. **running_equipment array** (most accurate) - e.g., `compCool1`, `auxHeat`
2. **Explicit hvac_mode** from API
3. **Infer from temperature vs setpoints** (temp > cool_setpoint = cooling, etc.)
4. **Single setpoint fallback**

**Filtering:** Server-side by `TARGET_THERMOSTAT_NAMES` env variable (comma-separated)

### ecobee-api.ts (Alternative Thermostat)
**OAuth2 Flow:** PIN-based authentication
- Step 1: Request PIN → User enters at ecobee.com
- Step 2: Exchange PIN for access/refresh tokens
- Token refresh: Automatic with 1-minute expiry buffer
- Storage: In-memory token caching

## Frontend Architecture

### weather-dashboard.tsx (Central Hub)
**Role:** Main page orchestrating all weather displays
- **Data fetching:** TanStack Query with 3-minute auto-refetch
- **Layout:** Adaptive based on orientation
  - Landscape: 2-column (left cards, right radar)
  - Portrait: Stacked vertical
- **Error handling:** Graceful fallback UI
- **Thermostat detection:** Auto-shows/hides based on API response

### Weather Card Components (client/src/components/weather/)

1. **top-banner** - Station name, ID, last update time, loading indicator
2. **temperature-card** - Current, feels like, daily high/low with timestamps
3. **wind-card** - Speed, gust, direction with animated compass
4. **pressure-card** - Barometric pressure with trend indicator
5. **rainfall-card** - Today's and yesterday's precipitation
6. **lightning-card** - Strike distance and time with alert animations
7. **humidity-dewpoint-card** - Humidity % and dew point
8. **thermostat-card** - Multi-thermostat display with:
   - **Color-coded status:**
     - Blue (cooling) / Red (heating) when HVAC active (pulsing animation)
     - Green (at target) / Orange (too warm) / Cyan (too cool) / White (close) when idle
   - **Status icons:** Snowflake/Flame/Pause with animated activity
9. **radar-display** - Embedded Windy.com radar centered on station
10. **additional-data-card** - UV index, brightness, etc.

### Responsive Design
**Custom Tailwind breakpoints:**
- `orientation-landscape` / `orientation-portrait`
- Typography scaling: `responsive-sm`, `responsive-md`, `responsive-lg`, `responsive-3xl`

### State Management
- **Server state:** TanStack Query (weather/thermostat data)
- **Client state:** React hooks (unit preferences, mobile detection)
- **Form state:** React Hook Form + Zod validation

## Data Flow

### Weather Data Flow
```
WeatherFlow API
    ↓
routes.ts (fetchWeatherFlowData)
    ↓
Unit conversions & calculations
    ↓
storage.saveWeatherData() / saveWeatherObservation()
    ↓
PostgreSQL or MemStorage
    ↓
GET /api/weather/current (with 2-min cache)
    ↓
TanStack Query (3-min refetch)
    ↓
weather-dashboard.tsx
    ↓
Individual card components
    ↓
Rendered UI
```

### Thermostat Data Flow
```
Beestat API
    ↓
routes.ts (fetchBeestatThermostats)
    ↓
HVAC mode inference & filtering
    ↓
storage.saveThermostatData()
    ↓
PostgreSQL (duplicate prevention)
    ↓
GET /api/thermostats/current (1-min cache)
    ↓
TanStack Query
    ↓
thermostat-card.tsx
    ↓
Color-coded display with HVAC status
```

## Environment Variables

### Required
- `WEATHERFLOW_API_TOKEN` - Personal access token from tempestwx.com
- `WEATHERFLOW_STATION_ID` - Numeric station ID
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `VITE_UNIT_SYSTEM` - `imperial` or `metric`
- `VITE_RADAR_CENTER_LAT` / `VITE_RADAR_CENTER_LON` - Map coordinates
- `VITE_RADAR_ZOOM_LEVEL` - Zoom level (5-10, default 7.25)

### Optional
- `BEESTAT_API_KEY` - Thermostat integration (hides card if blank)
- `TARGET_THERMOSTAT_NAMES` - Comma-separated filter list
- `VITE_STATION_DISPLAY_NAME` - Custom station name override
- `CLOUDFLARE_TUNNEL_TOKEN` - Internet exposure via Cloudflare
- `SESSION_SECRET` - Session encryption (auto-generated if missing)
- `NODE_ENV` - `production` or `development`
- `PORT` - Server port (default 5000)

## Build & Deployment

### Build Pipeline
```bash
npm run build
  → vite build (client: React → /dist/public)
  → esbuild (server: TypeScript → /dist/index.js)

npm start
  → node /dist/index.js
```

### Docker Compose Services
1. **postgres** - PostgreSQL 16 Alpine with health check
2. **app** - Weather Kiosk (depends on postgres health)
3. **cloudflared** - Cloudflare Tunnel (optional, depends on app)

## Key Architectural Decisions

1. **Monorepo with shared types** - Type safety across client/server boundary
2. **Dual storage strategy** - Resilience to database failures
3. **Simple in-memory cache** - Reduce API calls without complexity (no Redis needed)
4. **Observation-based calculations** - Accurate daily extremes from raw data vs forecast
5. **Server-side thermostat filtering** - Cleaner client code
6. **Beestat single endpoint** - Cost optimization vs direct Ecobee API
7. **Cloudflare Tunnel** - Secure internet access without exposed ports
8. **TanStack Query** - Powerful state management with minimal config
9. **Wouter router** - Lightweight (<3.5KB) vs React Router (~45KB)
10. **Tailwind + shadcn/ui** - Fast UI development with minimal custom CSS

## Caching Strategy

### In-Memory Cache (SimpleCache class)
- **Weather data:** 2-minute TTL, 3-minute refresh interval
- **Thermostat data:** 1-minute TTL for responsive updates
- **Fallback behavior:** Returns stale cache if API fails (with `stale: true` flag)
- **Implementation:** Map with expiry timestamps, no external dependencies

### Database Retention
- **weather_data:** 48 hours
- **weather_observations:** 7 days
- **thermostat_data:** Unlimited (duplicate prevention by thermostat_id)

## Error Resilience

1. **Database unavailable** → Falls back to in-memory storage
2. **API failures** → Returns cached data with stale flag
3. **Session storage** → MemoryStore in dev, PostgreSQL in production
4. **Missing optional fields** → Handled safely with nullish coalescing
5. **PostgreSQL connection issues** → Automatic fallback to MemStorage

## Testing & Development

### Development Mode
```bash
npm run dev
  → Runs Vite dev server with HMR
  → Express serves API at /api/*
  → Frontend proxies to backend
```

### Key Scripts
- `npm run dev` - Development mode with HMR
- `npm run build` - Production build
- `npm start` - Start production server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Launch Drizzle Studio (GUI)
- `npm run check` - TypeScript type checking

## Common Modification Patterns

### Adding a New Weather Card
1. Create component in `client/src/components/weather/`
2. Import in `weather-dashboard.tsx`
3. Add to layout (orientation-aware grid)
4. Fetch data via TanStack Query hook
5. Style with Tailwind + shadcn/ui components

### Adding a New API Endpoint
1. Define route in `server/routes.ts`
2. Add storage method to `IStorage` interface in `storage.ts`
3. Implement in both `PostgreSQLStorage` and `MemStorage`
4. Add types to `shared/schema.ts` if needed
5. Create frontend hook in `client/src/hooks/`

### Adding a New Database Table
1. Define schema in `shared/schema.ts` using Drizzle
2. Run `npm run db:generate` to create migration
3. Run `npm run db:migrate` to apply
4. Add storage methods to `storage.ts`
5. Update `MemStorage` for in-memory fallback

### Changing Unit Systems
- Conversions in `shared/units.ts` (temperature, speed, pressure, distance)
- Display formatting in `client/src/utils/format-values.ts`
- Toggle via `VITE_UNIT_SYSTEM` env variable

## Important Code Locations

- **API business logic:** `server/routes.ts:1-180+`
- **Storage interface:** `server/storage.ts:1-50`
- **Database schema:** `shared/schema.ts:1-200+`
- **Main dashboard:** `client/src/pages/weather-dashboard.tsx:1-400+`
- **HVAC mode inference:** `server/beestat-api.ts:100-150`
- **Daily temp calculation:** `server/routes.ts` (getDailyTemperatureExtremes usage)
- **Unit conversions:** `shared/units.ts:1-100+`
- **TanStack Query config:** `client/src/lib/queryClient.ts:1-20`

## Dependencies Worth Noting

### Critical Production Dependencies
- `drizzle-orm` - Database ORM
- `postgres` - PostgreSQL client
- `express` - Web server
- `@tanstack/react-query` - Frontend state management
- `wouter` - Routing
- `tailwindcss` - Styling
- `zod` - Runtime validation

### Development Only
- `vite` - Build tool
- `typescript` - Type checking
- `drizzle-kit` - Migration tool
- `@types/*` - Type definitions

## Performance Characteristics

- **Frontend bundle size:** Optimized with Vite code splitting
- **API response time:** <100ms (cached), <2s (uncached with API calls)
- **Database queries:** Indexed by timestamp for fast retrieval
- **Memory usage:** ~50MB (app) + ~30MB (PostgreSQL)
- **Refresh interval:** 3 minutes (weather), 1 minute (thermostat)

## Security Considerations

- **Session encryption:** SESSION_SECRET for cookie signing
- **HTTPS:** Via Cloudflare Tunnel
- **API key storage:** Environment variables only (never in code)
- **Database credentials:** Environment variables with connection pooling
- **OAuth tokens:** In-memory only (not persisted to disk)
- **DDoS protection:** Built into Cloudflare Tunnel

## Common Troubleshooting

### Issue: Thermostat card not showing
- **Check:** `BEESTAT_API_KEY` in .env
- **Check:** `TARGET_THERMOSTAT_NAMES` matches thermostat names in Beestat

### Issue: Database connection errors
- **Fallback:** App automatically uses in-memory storage
- **Fix:** Verify `DATABASE_URL` format and PostgreSQL is running

### Issue: Stale data indicators
- **Weather:** API call failed, using cache (check WeatherFlow API status)
- **Thermostat:** >5 minutes since last update (check Beestat API)

### Issue: Temperature extremes not updating
- **Check:** Observations are being saved to database
- **Check:** Timezone logic in `getDailyTemperatureExtremes` (Eastern hardcoded)

## Future Extension Points

- **Multi-station support** - Currently single station hardcoded
- **Alerts & notifications** - Lightning strikes, temperature thresholds
- **Historical charts** - Graph 48h of data
- **Mobile app** - PWA with offline support
- **Multiple timezones** - Make timezone configurable
- **More thermostat brands** - Add Nest, Honeywell integrations
