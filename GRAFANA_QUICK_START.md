# Grafana Quick Start Guide

## What You Just Got

Grafana has been fully integrated into your Weather Kiosk project! Here's what was added:

### Files Created
- `docker-compose.yml` - Added Grafana service
- `grafana/provisioning/datasources/postgres.yml` - Auto-configured PostgreSQL connection
- `grafana/provisioning/dashboards/dashboard-provider.yml` - Dashboard auto-loader
- `grafana/provisioning/dashboards/weather-overview.json` - Pre-built weather dashboard
- `.env.example` - Added Grafana credentials section

### Documentation Updated
- `README.md` - Added comprehensive Grafana section
- `LLM_README.md` - Created for AI assistants to understand your codebase

## Starting Grafana

### First Time Setup

1. **Add Grafana credentials to your `.env` file** (optional):
   ```bash
   # Add these lines to your .env file
   GRAFANA_ADMIN_USER=admin
   GRAFANA_ADMIN_PASSWORD=your_secure_password_here
   ```

   If you skip this step, defaults are `admin/admin`

2. **Start all services** (including Grafana):
   ```bash
   docker compose up -d
   ```

3. **Access Grafana**:
   - Open your browser to: http://localhost:3000
   - Login with your credentials
   - You'll see the pre-built "Weather Kiosk Overview" dashboard

## Your Pre-Built Dashboard

The **Weather Kiosk Overview** dashboard includes 11 panels:

### Current Conditions (Row 1)
1. **Temperature Gauge** - Color-coded from blue (cold) to red (hot)
2. **Wind Speed Gauge** - Shows current wind with threshold colors
3. **Humidity Gauge** - Percentage humidity with health indicators
4. **Barometric Pressure Gauge** - Shows pressure in hPa

### 24-Hour Trends (Rows 2-3)
5. **Temperature Trends** - Line graph showing temperature, feels like, and dew point
6. **Wind Speed** - Line graph with average wind and gusts
7. **Humidity Over Time** - Humidity percentage trend
8. **Barometric Pressure Trend** - Pressure changes over 24 hours

### Historical Data (Row 4)
9. **Rainfall (7 Days)** - Bar chart showing precipitation events
10. **Indoor vs Outdoor Temperature** - Compare your thermostat with outdoor conditions

### Activity Tracking (Row 5)
11. **Recent Thermostat Activity** - Table showing HVAC state changes (color-coded)

## Useful SQL Queries

Access any panel → Click title → **Edit** to customize queries

### Find Temperature Extremes
```sql
SELECT
  DATE_TRUNC('day', timestamp) as day,
  MAX(temperature) as high,
  MIN(temperature) as low
FROM weather_observations
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day;
```

### Calculate Average Daily Wind Speed
```sql
SELECT
  DATE_TRUNC('day', timestamp) as day,
  AVG(wind_speed) as avg_wind,
  MAX(wind_gust) as max_gust
FROM weather_observations
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY day;
```

### HVAC Runtime Today
```sql
SELECT
  hvac_state,
  COUNT(*) as readings,
  COUNT(*) * 3.0 / 60 as estimated_minutes
FROM thermostat_data
WHERE timestamp > DATE_TRUNC('day', NOW())
GROUP BY hvac_state;
```

### Dewpoint vs Temperature Correlation
```sql
SELECT
  temperature,
  dew_point,
  temperature - dew_point as spread
FROM weather_observations
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp;
```

## Customizing Your Dashboard

### Adding a New Panel

1. Click **Add panel** button (top right)
2. Select **Add a new panel**
3. Choose **Weather Kiosk PostgreSQL** as data source
4. Switch to **Code** mode (top right of query builder)
5. Write your SQL query
6. Configure visualization type (Time series, Gauge, Table, etc.)
7. Set title and save

### Changing Time Ranges

- **Top right corner**: Click time range dropdown
- Quick ranges: Last 6 hours, 12 hours, 24 hours, 7 days, 30 days
- Custom range: Click calendar icon
- **Refresh interval**: Set auto-refresh (30s, 1m, 5m, etc.)

### Dashboard Settings

- **Gear icon** (top right) → Settings
- Change dashboard name, tags, timezone
- Set default time range
- Configure variables for dynamic queries

## Available Data Tables

### weather_observations
**Retention: 7 days** | Individual measurements every ~3 minutes

Columns:
- `timestamp` - When observation was recorded
- `temperature` - Temperature in Fahrenheit
- `feels_like` - Apparent temperature
- `wind_speed`, `wind_gust`, `wind_direction`
- `pressure` - Barometric pressure (inHg)
- `humidity` - Relative humidity %
- `uv_index` - UV index
- `dew_point` - Dew point temperature
- `rain_accumulation` - Rain since last reading (inches)
- `lightning_strike_count` - Number of strikes detected
- `lightning_strike_distance` - Distance to strike (miles)

### weather_data
**Retention: 48 hours** | Processed summary data

Columns:
- All fields from weather_observations, plus:
- `temperature_high`, `temperature_low` - Daily extremes
- `temperature_high_time`, `temperature_low_time` - When extremes occurred
- `wind_direction_cardinal` - N, NE, E, SE, S, SW, W, NW
- `pressure_trend` - "Rising", "Falling", "Steady"
- `rain_today`, `rain_yesterday` - Daily totals

### thermostat_data
**Retention: Unlimited** | Indoor climate tracking

Columns:
- `timestamp` - Reading time
- `thermostat_id` - Unique thermostat identifier
- `name` - Location name (e.g., "Downstairs")
- `temperature` - Current indoor temp (Fahrenheit)
- `target_temp` - Setpoint
- `humidity` - Indoor humidity %
- `mode` - heat, cool, auto, off
- `hvac_state` - idle, heating, cooling

## Common Grafana Tasks

### Export Dashboard
1. Dashboard → **Share** → **Export**
2. Click **Save to file**
3. JSON file downloads (can share or backup)

### Import Dashboard
1. **Dashboards** menu → **New** → **Import**
2. Upload JSON file or paste JSON
3. Select data source: **Weather Kiosk PostgreSQL**
4. Click **Import**

### Create Alert
1. Edit panel → **Alert** tab
2. Configure condition (e.g., temperature > 95°F)
3. Set notification channel (email, Slack, webhook)
4. Save alert rule

### Change Visualization Type
1. Edit panel
2. Right sidebar → **Visualization** dropdown
3. Choose: Time series, Gauge, Stat, Table, Bar chart, etc.
4. Adjust settings and save

## Troubleshooting

### "No data" showing in panels

**Check if PostgreSQL has data:**
```bash
docker compose exec postgres psql -U weather_user -d weather_kiosk -c "SELECT COUNT(*) FROM weather_observations;"
```

If count is 0, your app needs time to collect data (wait 3-5 minutes)

### Can't login to Grafana

**Reset admin password:**
```bash
docker compose exec grafana grafana-cli admin reset-admin-password newpassword
```

### Dashboard not appearing

**Check provisioning:**
```bash
docker compose logs grafana | grep provision
```

Should see: "provisioning dashboards from configuration"

**Verify files exist:**
```bash
ls -la grafana/provisioning/dashboards/
```

### Connection refused errors

**Check Grafana is running:**
```bash
docker ps | grep grafana
```

**View Grafana logs:**
```bash
docker compose logs grafana
```

### Wrong time zone on graphs

1. Dashboard settings → **Timezone**
2. Change from "Browser time" to your timezone
3. Save dashboard

## Advanced Features

### Template Variables

Create dashboard variables for dynamic queries:

1. Dashboard settings → **Variables** → **Add variable**
2. Example variable: `$interval` for time grouping
3. Use in queries: `DATE_TRUNC('$interval', timestamp)`

### Annotations

Mark events on your graphs:

1. Dashboard settings → **Annotations**
2. Query for events (e.g., when HVAC turned on)
3. Events appear as vertical lines on time series

### Data Links

Click data points to drill down:

1. Edit panel → **Overrides**
2. Add field → **Data links**
3. Link to other dashboards or external URLs

## Next Steps

1. **Explore the data**: Click around panels, adjust time ranges
2. **Create custom panels**: Add panels for metrics you care about
3. **Set up alerts**: Get notified of extreme weather or HVAC issues
4. **Share dashboards**: Export and share with family/friends
5. **Learn more**: https://grafana.com/docs/grafana/latest/

## Useful Resources

- **Grafana Documentation**: https://grafana.com/docs/grafana/latest/
- **PostgreSQL Query Guide**: https://www.postgresql.org/docs/current/queries.html
- **Community Dashboards**: https://grafana.com/grafana/dashboards/
- **SQL Tutorial**: https://www.postgresql.org/docs/current/tutorial-sql.html

## Support

If you need help:
1. Check the troubleshooting section in `README.md`
2. View Grafana logs: `docker compose logs grafana`
3. Test PostgreSQL connection in Grafana: Configuration → Data Sources → Test
4. File an issue: https://github.com/willcassell/weather-kiosk/issues
