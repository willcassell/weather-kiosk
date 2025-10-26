# Database Queries

## Timezone Information

All timestamps in the database are stored in **UTC** (Coordinated Universal Time). This is a best practice that ensures data consistency across different timezones.

When you query the database directly, you'll see UTC timestamps. To convert to your local timezone, use PostgreSQL's `AT TIME ZONE` function.

### Your Timezone

Based on your `.env` configuration:
- **Timezone**: `America/New_York` (Eastern Time)
- **UTC Offset**: -05:00 (EST) or -04:00 (EDT)

### Converting Timestamps to Local Time

```sql
-- Example: View Beestat data in local time
SELECT
  thermostat_name,
  temperature,
  timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
FROM beestat_raw_data
WHERE thermostat_name = 'Home'
ORDER BY timestamp DESC
LIMIT 10;
```

### Common Queries

#### Recent Thermostat Data (Local Time)
```sql
SELECT
  name,
  temperature,
  target_temp,
  mode,
  timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
FROM thermostat_data
ORDER BY last_updated DESC
LIMIT 5;
```

#### Weather Data for Today (Local Time)
```sql
SELECT
  station_name,
  temperature,
  temperature_high,
  temperature_low,
  timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
FROM weather_data
WHERE timestamp >= (CURRENT_DATE AT TIME ZONE 'America/New_York')
ORDER BY timestamp DESC;
```

#### Thermostat Temperature History (Last 24 Hours, Local Time)
```sql
SELECT
  thermostat_name,
  temperature,
  target_temp,
  effective_mode,
  timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
FROM beestat_raw_data
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND thermostat_name = 'Home'
ORDER BY timestamp DESC;
```

#### Find Times When HVAC Was Running
```sql
SELECT
  thermostat_name,
  temperature,
  running_equipment,
  timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
FROM beestat_raw_data
WHERE running_equipment != '[]'
  AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

## Important Notes

1. **API Always Uses UTC**: The API returns timestamps in ISO 8601 format with UTC timezone (`2025-10-26T14:01:01.986Z`)

2. **Browser Automatically Converts**: When displayed in a web browser, JavaScript automatically converts UTC timestamps to the user's local timezone

3. **Database Queries Need Conversion**: When querying the database directly (e.g., via `psql`), you must manually convert using `AT TIME ZONE`

4. **Setting Your Timezone**: Update the `TIMEZONE` variable in `.env` to match your location:
   ```bash
   # Common US Timezones
   TIMEZONE=America/New_York      # Eastern Time
   TIMEZONE=America/Chicago       # Central Time
   TIMEZONE=America/Denver        # Mountain Time
   TIMEZONE=America/Los_Angeles   # Pacific Time

   # Find your timezone: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   ```

## Quick Access Commands

### Connect to Database
```bash
docker compose exec postgres psql -U weather_user -d weather_kiosk
```

### Query Latest Thermostat Data (Local Time)
```bash
docker compose exec postgres psql -U weather_user -d weather_kiosk -c \
  "SELECT thermostat_name, temperature,
   timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/New_York' as local_time
   FROM beestat_raw_data ORDER BY timestamp DESC LIMIT 5;"
```

### View All Tables
```bash
docker compose exec postgres psql -U weather_user -d weather_kiosk -c "\dt"
```

### Check Table Schema
```bash
docker compose exec postgres psql -U weather_user -d weather_kiosk -c "\d beestat_raw_data"
```
