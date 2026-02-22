# Weather Kiosk - Next Steps

Last Updated: 2026-02-21

## Overview

This document outlines the prioritized enhancements for the weather kiosk project. These improvements will add unit tests, historical data visualization, severe weather alerts, a configuration UI, and performance metrics.

---

## Completed Features 🎉

The following major priorities have been fully implemented and deployed:

1. **Unit Tests**: Full Vitest suite covering data validations, conversions, schema rules, and DB mock logic.
2. **Configuration UI**: Complete database-backed UI for configuring display, refresh rates, radar coordinates, and data retention dynamically without touching `.env`.
3. **Severe Weather Alerts**: Live background syncing with the NOAA NWS API seamlessly driving a red scrolling marquee banner whenever warnings apply to the local coordinates.
4. **Performance Metrics**: Telemetry buffering API durations and Background Job success latencies directly into PostgreSQL for monitoring (`/api/metrics`).

---

## Priority 1: Historical Data Visualization 📊

**Status**: Not Started
**Estimated Effort**: 3-4 days
**Libraries**: Recharts (React charting library)

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

### Historical Charts

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

- ✅ Temperature chart shows 24-hour trend
- ✅ Pressure chart shows 24-hour trend
- ✅ Rainfall chart shows 7-day totals
- ✅ Charts are responsive and look good on kiosk display
- ✅ Charts update in real-time as new data arrives

---

## Priority 2: Progressive Web App (PWA) 📱

**Status**: Not Started
**Estimated Effort**: 2 days

**Goal**: Make the dashboard installable as a native-feeling app on iOS and Android devices, complete with offline capabilities for cached data.

### Implementation Plan

1. Add `manifest.json` with appropriate app icons, colors, and display modes.
2. Implement a `service-worker.js` to cache static assets and latest API responses.
3. Update Vite config with `vite-plugin-pwa`.
4. Add visual offline indicators to the UI.

---

## Priority 3: Additional Data Sources 🌍

**Status**: Not Started
**Estimated Effort**: 3-5 days

**Goal**: Allow users without a WeatherFlow device to use the kiosk by integrating public weather APIs (e.g., OpenWeatherMap, Apple WeatherKit).

### Implementation Plan

1. Abstract the weather fetching logic into an interface (e.g., `IWeatherProvider`).
2. Add OpenWeatherMap as a supported provider.
3. Add API key fields for providers in the Configuration UI.
4. Seamlessly integrate the `shared/schema.ts` mappings.
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

2. **Day 6-7**: Historical Charts (Part 1)
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

2. **Day 10-12**: Configuration UI
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
