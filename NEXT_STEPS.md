# Weather Kiosk - Next Steps

Last Updated: 2026-02-21

## Overview

This document outlines the prioritized enhancements for the weather kiosk project. These improvements will add unit tests, historical data visualization, severe weather alerts, a configuration UI, and performance metrics.

---

## Priority 1: Unit Tests 🧪

**Status**: Not Started
**Estimated Effort**: 2-3 days
**Framework**: Vitest (already compatible with Vite)

### What to Test

#### 1. Unit Conversion Functions
Create a new file: `shared/conversions.test.ts`

**Test Cases**:
- Temperature conversions:
  - `celsiusToFahrenheit(0)` → `32`
  - `celsiusToFahrenheit(100)` → `212`
  - `fahrenheitToCelsius(32)` → `0`
  - `fahrenheitToCelsius(212)` → `100`
- Wind speed conversions:
  - `metersPerSecondToMph(10)` → `22.369`
  - `mphToMetersPerSecond(22.369)` → `10`
- Pressure conversions:
  - `millibarToInHg(1013.25)` → `29.92`
  - `inHgToMillibar(29.92)` → `1013.25`
- Distance conversions:
  - `kilometersToMiles(1.60934)` → `1`
  - `milesToKilometers(1)` → `1.60934`
- Precipitation conversions:
  - `millimetersToInches(25.4)` → `1`
  - `inchesToMillimeters(1)` → `25.4`

#### 2. Data Validation Functions
Create: `server/api-validation.test.ts`

**Test Cases**:
- `validateWeatherDataQuality()`:
  - Normal temperature (70°F) → no warnings
  - Extreme cold (-100°F) → warning
  - Extreme heat (200°F) → warning
  - Negative wind speed → warning
  - Wind speed 250 mph → warning
  - Low pressure (25 inHg) → warning
  - High pressure (35 inHg) → warning
  - Invalid humidity (150%) → warning
  - Negative humidity → warning

- `detectTemperatureSpike()`:
  - 70°F → 72°F (delta 2°F) → false
  - 70°F → 95°F (delta 25°F) → true
  - Custom threshold test

#### 3. API Schema Validation
Create: `server/api-validation.schema.test.ts`

**Test Cases**:
- Valid WeatherFlow response → passes
- Missing optional fields → passes
- Missing required fields → fails
- Invalid data types → fails
- Valid Beestat response → passes
- Missing thermostat identifier → passes (optional)
- Invalid thermostat data → fails

#### 4. Database Operations
Create: `server/storage.test.ts`

**Test Cases** (use in-memory SQLite or test database):
- `saveWeatherObservation()` → inserts correctly
- `saveWeatherData()` → inserts correctly
- `getLatestWeatherData()` → returns most recent
- `saveThermostatData()` → handles multiple thermostats
- `cleanupOldData()` → deletes old records based on retention
- Index creation → verify indexes exist

### Setup Steps

1. **Install Vitest**:
   ```bash
   npm install -D vitest @vitest/ui
   ```

2. **Update package.json**:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

3. **Create vitest.config.ts**:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import path from 'path';

   export default defineConfig({
     test: {
       globals: true,
       environment: 'node',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
       },
     },
     resolve: {
       alias: {
         '@shared': path.resolve(__dirname, './shared'),
         '@server': path.resolve(__dirname, './server'),
       },
     },
   });
   ```

4. **Create test files** in the locations mentioned above

5. **Run tests**:
   ```bash
   npm test
   ```

### Success Criteria
- ✅ All unit conversions accurate to 3 decimal places
- ✅ Data validation catches all edge cases
- ✅ Schema validation handles API variations
- ✅ 80%+ code coverage on critical functions
- ✅ CI/CD integration (GitHub Actions)

---

## Priority 2: Historical Data Visualization & Severe Weather Alerts 📊🚨

**Status**: Not Started
**Estimated Effort**: 3-4 days
**Libraries**: Recharts (React charting library)

### Part A: Severe Weather Alerts in Header

**Goal**: Display active NOAA weather alerts in the top banner with red background

#### Implementation Plan

1. **Add WeatherFlow Alerts API Integration**

   WeatherFlow provides weather alerts via their API:
   ```
   GET https://swd.weatherflow.com/swd/rest/better_forecast?station_id={STATION_ID}&token={TOKEN}
   ```

   Response includes `current_conditions.alert` field with active alerts.

2. **Create Alert Data Types** (`shared/schema.ts`):
   ```typescript
   export interface WeatherAlert {
     id: string;
     severity: 'extreme' | 'severe' | 'moderate' | 'minor';
     certainty: 'observed' | 'likely' | 'possible' | 'unlikely';
     event: string; // "Tornado Warning", "Severe Thunderstorm Watch", etc.
     headline: string;
     description: string;
     instruction?: string;
     onset: Date;
     expires: Date;
     affectedZones: string[];
   }
   ```

3. **Add Alert Endpoint** (`server/routes.ts`):
   ```typescript
   app.get("/api/weather/alerts", async (req, res) => {
     // Fetch from WeatherFlow API
     // Parse and validate alerts
     // Return active alerts (not expired)
   });
   ```

4. **Update TopBanner Component** (`client/src/components/weather/top-banner.tsx`):

   **Changes**:
   - Add `activeAlerts?: WeatherAlert[]` prop
   - Conditionally render alert banner above station name
   - Red background for severe/extreme alerts
   - Yellow/orange for moderate alerts
   - Scrolling text for long alert messages
   - Click to expand for full details

   **Visual Design**:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │ 🚨 SEVERE THUNDERSTORM WARNING until 11:30 PM - Click for... │ ← Red bg
   ├─────────────────────────────────────────────────────────────┤
   │ 📻 Corner Rock Wx  ● Healthy     🕐 Last updated: 6:00 PM   │
   └─────────────────────────────────────────────────────────────┘
   ```

5. **Add Alert Query** (`client/src/pages/weather-dashboard.tsx`):
   ```typescript
   const { data: alerts } = useQuery<WeatherAlert[]>({
     queryKey: ['/api/weather/alerts'],
     refetchInterval: 5 * 60 * 1000, // 5 minutes
   });
   ```

6. **Alert Priority Logic**:
   - Show highest severity alert only (don't stack multiple alerts)
   - Priority: extreme > severe > moderate > minor
   - Auto-dismiss when expired
   - Flash/pulse animation for extreme alerts

### Part B: Historical Charts

**Goal**: Add expandable charts showing 24-hour and 7-day trends

#### Charts to Implement

1. **Temperature Chart** (24-hour):
   - Line chart with current temp, feels like, high/low markers
   - X-axis: Time (hourly)
   - Y-axis: Temperature (°F or °C)
   - Data source: `weather_data` table (retention: 2 days, so we have 24-48 hours)

2. **Pressure Trend Chart** (24-hour):
   - Line chart with pressure readings
   - Helpful for weather prediction (falling = storm coming)
   - Show trend arrow (rising/falling/steady)
   - Data source: `weather_data` table

3. **Wind Speed Chart** (24-hour):
   - Line chart with average wind and gusts
   - X-axis: Time
   - Y-axis: Wind speed (mph or m/s)
   - Data source: `weather_data` table

4. **Rainfall Accumulation Chart** (7-day):
   - Bar chart with daily rainfall totals
   - X-axis: Day of week
   - Y-axis: Rainfall (inches or mm)
   - Data source: Would need to aggregate from `weather_observations` or add daily rainfall table

5. **HVAC Runtime Chart** (7-day):
   - Stacked bar chart: heating hours (orange) + cooling hours (blue) per day
   - Shows efficiency and usage patterns
   - Data source: `thermostat_data` table (retention: 90 days)

#### Implementation Plan

1. **Install Recharts**:
   ```bash
   npm install recharts
   ```

2. **Create API Endpoints** (`server/routes.ts`):
   ```typescript
   // Get 24-hour temperature history
   app.get("/api/weather/history/temperature", async (req, res) => {
     const hours = parseInt(req.query.hours as string) || 24;
     // Query weather_data table for last N hours
   });

   // Get 7-day rainfall totals
   app.get("/api/weather/history/rainfall", async (req, res) => {
     // Query and aggregate by day
   });

   // Get HVAC runtime by day
   app.get("/api/thermostats/history/runtime", async (req, res) => {
     // Query thermostat_data, calculate runtime per day
   });
   ```

3. **Create Chart Components** (`client/src/components/weather/charts/`):
   - `TemperatureChart.tsx`
   - `PressureChart.tsx`
   - `WindChart.tsx`
   - `RainfallChart.tsx`
   - `HVACRuntimeChart.tsx`

4. **Add Chart Modal/Expandable Section**:
   - Click on any weather card to expand and show historical chart
   - Modal overlay with chart details
   - Time range selector (24h, 7d, 30d)
   - Responsive design for kiosk display

5. **Update Retention Policy** (if needed):
   - Current `RETENTION_WEATHER_DATA_DAYS=2` only gives 24-48 hours
   - For 7-day charts, increase to `RETENTION_WEATHER_DATA_DAYS=7`
   - Update `.env` and `.env.example`

### Database Queries Needed

Add to `server/storage.ts`:

```typescript
async getTemperatureHistory(hours: number = 24): Promise<TemperaturePoint[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await this.db
    .select({
      timestamp: weatherData.timestamp,
      temperature: weatherData.temperature,
      feelsLike: weatherData.feelsLike,
    })
    .from(weatherData)
    .where(sql`${weatherData.timestamp} >= ${cutoff}`)
    .orderBy(weatherData.timestamp);
}

async getRainfallByDay(days: number = 7): Promise<RainfallPoint[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Aggregate by day
  return await this.db
    .select({
      day: sql`DATE(${weatherData.timestamp})`,
      totalRainfall: sql`SUM(${weatherData.rainToday})`,
    })
    .from(weatherData)
    .where(sql`${weatherData.timestamp} >= ${cutoff}`)
    .groupBy(sql`DATE(${weatherData.timestamp})`)
    .orderBy(sql`DATE(${weatherData.timestamp})`);
}

async getHVACRuntimeByDay(days: number = 7): Promise<HVACRuntimePoint[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Calculate runtime based on running_equipment field
  // This requires more complex logic to track when HVAC was on/off
}
```

### Success Criteria
- ✅ Severe weather alerts display in red banner at top
- ✅ Alerts auto-refresh every 5 minutes
- ✅ Expired alerts automatically dismissed
- ✅ Temperature chart shows 24-hour trend
- ✅ Pressure chart shows 24-hour trend
- ✅ Rainfall chart shows 7-day totals
- ✅ Charts are responsive and look good on kiosk display
- ✅ Charts update in real-time as new data arrives

---

## Priority 3: Configuration UI ⚙️

**Status**: Not Started
**Estimated Effort**: 2-3 days

### Proposed Design

**Goal**: Web-based settings page to adjust configuration without editing `.env` file or restarting server

#### Configuration Categories

##### 1. Display Settings
- **Station Display Name**: Text input
  - Current: `VITE_STATION_DISPLAY_NAME`
  - Default: Station name from API
  - Example: "Corner Rock Wx", "Home Weather", "Farm Station"

- **Unit System**: Toggle switch
  - Current: `VITE_UNIT_SYSTEM`
  - Options: Imperial (°F, mph, inHg) / Metric (°C, m/s, mb)
  - Live preview of conversion

- **Timezone**: Dropdown
  - Current: `TIMEZONE`
  - Options: All standard timezones
  - Example: America/New_York, America/Chicago, America/Los_Angeles

##### 2. Refresh Intervals
- **Weather Data Refresh**: Slider (1-15 minutes)
  - Current: Hardcoded to 3 minutes
  - Add: `WEATHER_REFRESH_INTERVAL_MINUTES` env var
  - Default: 3 minutes
  - Note: WeatherFlow rate limits apply

- **Thermostat Data Refresh**: Slider (1-30 minutes)
  - Current: Hardcoded to 3 minutes
  - Add: `THERMOSTAT_REFRESH_INTERVAL_MINUTES` env var
  - Default: 3 minutes
  - Note: Beestat sync interval (currently 3 min)

- **Health Check Interval**: Slider (30 sec - 5 minutes)
  - Current: Hardcoded to 1 minute
  - Default: 1 minute

##### 3. Radar Settings
- **Center Latitude**: Number input
  - Current: `VITE_RADAR_CENTER_LAT`
  - Default: Station location
  - Range: -90 to 90

- **Center Longitude**: Number input
  - Current: `VITE_RADAR_CENTER_LON`
  - Default: Station location
  - Range: -180 to 180

- **Zoom Level**: Slider
  - Current: `VITE_RADAR_ZOOM_LEVEL`
  - Default: 7.25
  - Range: 4 (wide area) to 12 (close zoom)
  - Live preview on mini map

##### 4. Data Retention Policies
- **Weather Observations**: Slider (1-30 days)
  - Current: `RETENTION_WEATHER_OBSERVATIONS_DAYS`
  - Default: 7 days
  - Shows estimated database size

- **Weather Data**: Slider (1-7 days)
  - Current: `RETENTION_WEATHER_DATA_DAYS`
  - Default: 2 days

- **Thermostat Data**: Slider (7-365 days)
  - Current: `RETENTION_THERMOSTAT_DATA_DAYS`
  - Default: 90 days

- **Beestat Raw Data**: Slider (1-30 days)
  - Current: `RETENTION_BEESTAT_RAW_DAYS`
  - Default: 7 days

- **Cleanup Schedule**: Dropdown
  - Current: Daily at 3 AM (or custom interval)
  - Options: Daily at [time picker], Every N hours
  - Show next scheduled cleanup time

##### 5. Thermostat Display
- **Show Thermostats**: Checkbox list
  - Current: Shows all configured thermostats
  - Options: Show/hide each thermostat individually
  - Example: ☑ Downstairs, ☑ 809 Sailors Cove

- **Thermostat Card Size**: Dropdown per thermostat
  - Options: Compact, Standard, Detailed
  - Affects vertical space in dashboard

##### 6. Advanced Settings
- **Session Secret**: Read-only display (masked)
  - Security: Don't allow editing via UI

- **API Tokens**: Read-only display (masked)
  - Security: Don't allow editing via UI
  - Show last 4 characters only
  - Example: "WeatherFlow: ****-****-****-92e"

- **Database URL**: Read-only display (masked)
  - Security: Don't allow editing via UI

#### Implementation Approach

##### Option A: Environment Variable Based (Recommended)

**How It Works**:
1. UI sends configuration changes to backend
2. Backend updates `.env` file on disk
3. Backend restarts relevant services (NOT full server restart)
4. Configuration persists across server restarts

**Pros**:
- Simple implementation
- Configuration persists in `.env` file (version control friendly)
- No new database tables needed
- Familiar pattern (already using `.env`)

**Cons**:
- Requires file system write access
- Some settings require service restart to apply

**Code Structure**:
```typescript
// server/routes.ts
app.get("/api/config", async (req, res) => {
  // Read current .env values
  const config = {
    displayName: process.env.VITE_STATION_DISPLAY_NAME,
    unitSystem: process.env.VITE_UNIT_SYSTEM,
    timezone: process.env.TIMEZONE,
    // ... all configurable settings
  };
  res.json(config);
});

app.post("/api/config", async (req, res) => {
  // Validate incoming config
  // Update .env file using dotenv-expand or custom parser
  // Reload environment variables
  // Restart affected services (background jobs, etc.)
  // Return success
});
```

##### Option B: Database-Based Configuration

**How It Works**:
1. Create new `app_settings` table in database
2. UI sends configuration changes to backend
3. Backend saves to database
4. Application reads from database on startup and periodically

**Pros**:
- No file system writes needed
- Instant updates (no restart required)
- Can track configuration history
- Multiple instances can share config

**Cons**:
- More complex implementation
- New database table and migrations
- `.env` file still needed for initial bootstrap
- Configuration split across two locations

**Code Structure**:
```typescript
// server/db/schema.ts
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// server/routes.ts
app.get("/api/config", async (req, res) => {
  const settings = await storage.getAllSettings();
  res.json(settings);
});

app.post("/api/config", async (req, res) => {
  await storage.updateSettings(req.body);
  // Emit event to reload config in background jobs
  res.json({ success: true });
});
```

#### UI Design (React Component)

**Route**: `/settings` (accessible via gear icon in top banner)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                    [Save]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📺 Display Settings                                    │
│   Station Name: [Corner Rock Wx            ]          │
│   Unit System:  Imperial ⚫──○ Metric                  │
│   Timezone:     [America/New_York ▼]                  │
│                                                        │
│ ⏱️ Refresh Intervals                                   │
│   Weather Data:    ──●─────  3 minutes                │
│   Thermostat Data: ──●─────  3 minutes                │
│   Health Check:    ──●─────  1 minute                 │
│                                                        │
│ 🗺️ Radar Settings                                      │
│   Center Latitude:  [37.000    ]                      │
│   Center Longitude: [-78.415   ]                      │
│   Zoom Level:       ──────●───  7.25                  │
│   [Preview Map]                                        │
│                                                        │
│ 💾 Data Retention                                      │
│   Weather Observations: ───●────  7 days              │
│   Weather Data:         ─●──────  2 days              │
│   Thermostat Data:      ────────●  90 days            │
│   Beestat Raw Data:     ───●────  7 days              │
│   Cleanup Schedule:     [Daily at 3:00 AM ▼]          │
│   Next Cleanup:         Feb 22, 2026 at 3:00 AM       │
│                                                        │
│ 🌡️ Thermostat Display                                 │
│   ☑ Downstairs         Size: [Standard ▼]            │
│   ☑ 809 Sailors Cove   Size: [Standard ▼]            │
│                                                        │
│ 🔒 Advanced (Read-Only)                                │
│   WeatherFlow Token: ****-****-****-92e               │
│   Beestat API Key:   ****-****-****-c16               │
│   Database:          postgres://***@postgres:5432/*** │
│                                                        │
│                          [Reset to Defaults] [Cancel] │
└────────────────────────────────────────────────────────┘
```

**Features**:
- Real-time validation (show errors before saving)
- Unsaved changes warning ("You have unsaved changes")
- Reset to defaults button
- Export/import configuration (JSON file)
- Loading state while saving
- Success/error toast notifications
- Responsive design (works on tablet in landscape)

#### Files to Create/Modify

1. **New Route**: `client/src/pages/settings.tsx`
2. **New Component**: `client/src/components/settings/`
   - `DisplaySettings.tsx`
   - `RefreshIntervals.tsx`
   - `RadarSettings.tsx`
   - `RetentionSettings.tsx`
   - `ThermostatSettings.tsx`
3. **Backend**: `server/routes.ts` (add `/api/config` GET/POST)
4. **Backend**: `server/config-manager.ts` (new file for .env manipulation)
5. **Update**: `client/src/components/weather/top-banner.tsx` (add gear icon link)

#### Security Considerations

- **Authentication**: Since this is a private kiosk, no auth needed (but could add basic auth)
- **Validation**: Validate all inputs server-side (prevent injection, out-of-range values)
- **Read-Only Secrets**: Never expose full API tokens or database passwords
- **File Permissions**: Ensure `.env` file has correct permissions (600) after write
- **Backup**: Create `.env.backup` before modifying `.env` file

### Success Criteria
- ✅ Settings page accessible via UI
- ✅ All display settings can be changed without editing files
- ✅ Changes persist across server restarts
- ✅ Settings apply immediately (or with clear "restart required" message)
- ✅ No accidental exposure of secrets
- ✅ Validation prevents invalid configurations
- ✅ Mobile-friendly settings page

### Recommendation: Option A (Environment Variable Based)

**Why**: Simpler to implement, configuration stays in version control, no schema changes needed. The slight inconvenience of service restarts is acceptable for a private kiosk that's configured infrequently.

---

## Priority 4: Performance Metrics & Analytics 📈

**Status**: Not Started
**Estimated Effort**: 1-2 days

### What to Track

#### 1. API Performance Metrics
- **WeatherFlow API**:
  - Response time (p50, p95, p99)
  - Success rate (%)
  - Error rate (%)
  - Rate limit hits
  - Last successful fetch timestamp
  - Consecutive failures count

- **Beestat API**:
  - Same metrics as WeatherFlow
  - Sync trigger success rate
  - Time since last thermostat data update

#### 2. Database Performance
- **Query Performance**:
  - Average query time by operation
  - Slow query log (queries > 100ms)
  - Connection pool usage

- **Data Freshness**:
  - Time since last weather observation
  - Time since last weather data insert
  - Time since last thermostat update
  - Gaps in data (missing intervals)

#### 3. Background Job Metrics
- **Thermostat Sync Job**:
  - Execution count
  - Success rate
  - Average duration
  - Last run timestamp
  - Next scheduled run

- **Database Cleanup Job**:
  - Execution count
  - Records deleted per run
  - Average duration
  - Disk space recovered
  - Last run timestamp

#### 4. System Health Metrics
- **Uptime**: Already tracked in `/api/health`
- **Memory Usage**: Process memory, heap usage
- **CPU Usage**: If available
- **Disk Space**: Database size, available space

### Implementation Plan

#### 1. Add Metrics Collection

Create `server/metrics.ts`:

```typescript
interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  lastSuccessTimestamp?: Date;
  lastErrorTimestamp?: Date;
  lastError?: string;
  consecutiveFailures: number;
}

interface BackgroundJobMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalDuration: number;
  lastRunTimestamp?: Date;
  lastRunDuration?: number;
  lastRunStatus?: 'success' | 'failure';
}

class MetricsCollector {
  private weatherFlowMetrics: APIMetrics;
  private beestatMetrics: APIMetrics;
  private thermostatJobMetrics: BackgroundJobMetrics;
  private cleanupJobMetrics: BackgroundJobMetrics;

  recordAPICall(service: 'weatherflow' | 'beestat', success: boolean, duration: number, error?: string) {
    // Update metrics
  }

  recordBackgroundJob(job: 'thermostat' | 'cleanup', success: boolean, duration: number) {
    // Update metrics
  }

  getMetrics() {
    return {
      weatherFlow: this.calculateStats(this.weatherFlowMetrics),
      beestat: this.calculateStats(this.beestatMetrics),
      backgroundJobs: {
        thermostatSync: this.calculateJobStats(this.thermostatJobMetrics),
        cleanup: this.calculateJobStats(this.cleanupJobMetrics),
      },
    };
  }

  private calculateStats(metrics: APIMetrics) {
    return {
      totalRequests: metrics.totalRequests,
      successRate: metrics.totalRequests > 0
        ? (metrics.successfulRequests / metrics.totalRequests) * 100
        : 0,
      averageResponseTime: metrics.totalRequests > 0
        ? metrics.totalResponseTime / metrics.totalRequests
        : 0,
      consecutiveFailures: metrics.consecutiveFailures,
      lastSuccess: metrics.lastSuccessTimestamp,
      lastError: metrics.lastError,
    };
  }
}

export const metricsCollector = new MetricsCollector();
```

#### 2. Instrument Existing Code

**Modify `server/routes.ts`**:
```typescript
// Wrap WeatherFlow API calls
const startTime = Date.now();
try {
  const data = await fetchWeatherFlowData();
  metricsCollector.recordAPICall('weatherflow', true, Date.now() - startTime);
  // ... rest of handler
} catch (error) {
  metricsCollector.recordAPICall('weatherflow', false, Date.now() - startTime, error.message);
  throw error;
}
```

**Modify `server/beestat-api.ts`**:
```typescript
// Similar instrumentation for Beestat calls
```

**Modify `server/background-jobs.ts`**:
```typescript
async function syncThermostatData() {
  const startTime = Date.now();
  try {
    // ... existing sync logic
    metricsCollector.recordBackgroundJob('thermostat', true, Date.now() - startTime);
  } catch (error) {
    metricsCollector.recordBackgroundJob('thermostat', false, Date.now() - startTime);
    throw error;
  }
}

async function cleanupOldData() {
  const startTime = Date.now();
  try {
    // ... existing cleanup logic
    metricsCollector.recordBackgroundJob('cleanup', true, Date.now() - startTime);
  } catch (error) {
    metricsCollector.recordBackgroundJob('cleanup', false, Date.now() - startTime);
    throw error;
  }
}
```

#### 3. Add Metrics Endpoint

**Add to `server/routes.ts`**:
```typescript
app.get("/api/metrics", async (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();

    // Add database metrics
    const dbSize = await storage.getDatabaseSize();
    const recordCounts = await storage.getRecordCounts();

    res.json({
      apis: metrics,
      database: {
        sizeBytes: dbSize,
        sizeMB: (dbSize / 1024 / 1024).toFixed(2),
        tables: recordCounts,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 4. Add Metrics Display to Health Indicator

**Option 1: Metrics Page**
- Add new route `/metrics` with detailed dashboard
- Show charts for API response times over time
- Show success rates as pie charts
- Show background job history

**Option 2: Enhance Health Endpoint**
- Add metrics summary to existing `/api/health` response
- Display in expandable section on dashboard

**Option 3: Both**
- Basic metrics in health check
- Detailed metrics page accessible via link

#### 5. Add Database Helper Methods

**Add to `server/storage.ts`**:
```typescript
async getDatabaseSize(): Promise<number> {
  const result = await this.db.execute(sql`
    SELECT pg_database_size(current_database()) as size
  `);
  return result.rows[0].size;
}

async getRecordCounts(): Promise<Record<string, number>> {
  const tables = ['weather_observations', 'weather_data', 'thermostat_data', 'beestat_raw_data'];
  const counts: Record<string, number> = {};

  for (const table of tables) {
    const result = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(table)}
    `);
    counts[table] = result.rows[0].count;
  }

  return counts;
}

async getDataFreshness(): Promise<Record<string, Date | null>> {
  const weatherData = await this.db
    .select({ timestamp: weatherData.timestamp })
    .from(weatherData)
    .orderBy(desc(weatherData.timestamp))
    .limit(1);

  const thermostatData = await this.db
    .select({ timestamp: thermostatData.timestamp })
    .from(thermostatData)
    .orderBy(desc(thermostatData.timestamp))
    .limit(1);

  return {
    lastWeatherData: weatherData[0]?.timestamp || null,
    lastThermostatData: thermostatData[0]?.timestamp || null,
  };
}
```

### UI Component (Optional)

Create `client/src/pages/metrics.tsx`:

```tsx
interface MetricsData {
  apis: {
    weatherFlow: {
      totalRequests: number;
      successRate: number;
      averageResponseTime: number;
      consecutiveFailures: number;
      lastSuccess?: Date;
      lastError?: string;
    };
    beestat: {
      // same structure
    };
  };
  database: {
    sizeBytes: number;
    sizeMB: string;
    tables: Record<string, number>;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    nodeVersion: string;
  };
}

export default function MetricsPage() {
  const { data } = useQuery<MetricsData>({
    queryKey: ['/api/metrics'],
    refetchInterval: 30 * 1000, // 30 seconds
  });

  return (
    <div className="p-4 space-y-4">
      <h1>System Metrics</h1>

      {/* API Performance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>WeatherFlow API</CardHeader>
          <CardContent>
            <div>Total Requests: {data?.apis.weatherFlow.totalRequests}</div>
            <div>Success Rate: {data?.apis.weatherFlow.successRate.toFixed(2)}%</div>
            <div>Avg Response: {data?.apis.weatherFlow.averageResponseTime.toFixed(0)}ms</div>
            {data?.apis.weatherFlow.consecutiveFailures > 0 && (
              <div className="text-red-500">
                Consecutive Failures: {data.apis.weatherFlow.consecutiveFailures}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Similar card for Beestat */}
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>Database</CardHeader>
        <CardContent>
          <div>Size: {data?.database.sizeMB} MB</div>
          <div>Tables:</div>
          <ul>
            {Object.entries(data?.database.tables || {}).map(([table, count]) => (
              <li key={table}>{table}: {count.toLocaleString()} records</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>System</CardHeader>
        <CardContent>
          <div>Uptime: {formatUptime(data?.system.uptime)}</div>
          <div>Memory: {(data?.system.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB</div>
          <div>Node: {data?.system.nodeVersion}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Success Criteria
- ✅ API response times tracked and reported
- ✅ Success rates visible for all external APIs
- ✅ Background job execution tracked
- ✅ Database size and record counts visible
- ✅ Metrics endpoint returns comprehensive data
- ✅ Metrics display updates in real-time
- ✅ Historical metrics retained (optional: store in database)

---

## Backlog 📋

These items are lower priority and can be implemented later:

### 1. Progressive Web App (PWA) Features
**Reason to Punt**: This is a kiosk display, not a mobile app. PWA features like offline mode and "Add to Home Screen" aren't relevant for a fixed kiosk installation.

### 2. Alerting & Monitoring Integration
- Email/SMS notifications on health degradation
- Slack/Discord webhooks
- PagerDuty integration
- External uptime monitoring

**Reason to Punt**: Can be added once the system has been running reliably for a while. Current health indicator provides visual feedback on the kiosk itself.

### 3. Backup & Restore
- Automated PostgreSQL backups
- S3/cloud storage integration
- Configuration export/import

**Reason to Punt**: Weather data is not critical (it's replaceable from APIs). Database is small after cleanup. Nice to have but not urgent.

### 4. Additional Data Sources
- Additional weather stations
- Indoor air quality sensors
- Smart home integrations
- Utility usage tracking
- Solar panel production

**Reason to Punt**: Would require new hardware or accounts. Can be added as you expand your monitoring infrastructure.

### 5. UI Enhancements
- Dark mode toggle
- Color theme customization
- Drag & drop card layout
- Different view modes (compact/detailed)
- Animated weather icons

**Reason to Punt**: Current UI is functional and looks good. Polish can come later once core features are solid.

### 6. Multi-Language Support
- Internationalization (i18n)
- Spanish, French, German translations

**Reason to Punt**: Single-user kiosk in English-speaking household.

### 7. User Authentication
- Login system
- Multiple user profiles
- Role-based access control

**Reason to Punt**: Private kiosk on local network. Not publicly accessible.

### 8. Mobile App
- React Native mobile app
- Push notifications
- Remote monitoring

**Reason to Punt**: Kiosk is the primary interface. Web dashboard accessible on mobile browser if needed.

---

## Implementation Order

Recommended sequence to tackle these priorities:

### Week 1: Foundation
1. **Day 1-2**: Unit Tests
   - Set up Vitest
   - Write conversion tests
   - Write validation tests
   - Achieve 80% coverage

2. **Day 3**: Performance Metrics
   - Add metrics collection
   - Instrument existing code
   - Create metrics endpoint

### Week 2: Features
3. **Day 4-5**: Severe Weather Alerts
   - Integrate WeatherFlow alerts API
   - Add alert banner to header
   - Test with historical alerts

4. **Day 6-7**: Historical Charts (Part 1)
   - Install Recharts
   - Create temperature chart
   - Create pressure chart
   - Add API endpoints

### Week 3: More Features
5. **Day 8-9**: Historical Charts (Part 2)
   - Create wind chart
   - Create rainfall chart
   - Create HVAC runtime chart
   - Add chart modal/expansion

6. **Day 10-12**: Configuration UI
   - Create settings page
   - Implement .env updater
   - Add all configuration sections
   - Test and polish

---

## Testing Strategy

For each feature:

1. **Unit Tests**: Test individual functions/components
2. **Integration Tests**: Test API endpoints with real database
3. **Manual Testing**: Verify on actual kiosk display
4. **Performance Testing**: Ensure no regression in load times
5. **Edge Case Testing**: Test error conditions, missing data, API failures

---

## Success Metrics

After completing all priorities, we should have:

- ✅ **Test Coverage**: 80%+ on critical code paths
- ✅ **Severe Weather Alerts**: Visible within 5 minutes of issuance
- ✅ **Historical Charts**: 24-hour and 7-day trends for all key metrics
- ✅ **Configuration UI**: All common settings adjustable via web UI
- ✅ **Performance Metrics**: API and background job health visible
- ✅ **Zero Manual Config**: No need to edit .env or restart server for common changes
- ✅ **System Reliability**: <1% downtime, all health checks green
- ✅ **Data Quality**: All validation checks catching anomalies

---

## Notes

- Keep database retention settings in mind when implementing historical charts
- Consider adding a "System Info" page that shows current config, metrics, and health in one place
- Document all new API endpoints in README.md
- Update .env.example with any new environment variables
- Consider adding a "What's New" section to track recent changes

---

## Questions to Resolve Before Starting

1. **Configuration UI**: Confirm Option A (env file based) vs Option B (database based)
2. **Weather Alerts**: Should we also check NOAA API directly, or rely on WeatherFlow?
3. **Historical Charts**: Should we increase `RETENTION_WEATHER_DATA_DAYS` to 7+ for better charts?
4. **Metrics Storage**: Should metrics be ephemeral (in-memory) or persisted to database?
5. **Settings Access**: Should settings page be password protected, or open since it's local?

---

Last Updated: 2026-02-21 by Claude Code
