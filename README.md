# WeatherFlow Tempest Weather Kiosk

A modern, secure weather monitoring application that displays real-time data from your WeatherFlow Tempest weather station with optional Ecobee thermostat integration. Built with React, TypeScript, and designed for continuous kiosk display with secure internet access via Cloudflare Tunnel.

<!-- **Live Demo**: [https://weather.dukestv.cc](https://weather.dukestv.cc) -->

---

## 🚀 Quick Start

**New to this project?** See the [Quick Start Guide](./QUICK_START.md) for a simple 5-minute setup.

**Need detailed deployment instructions?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for various platforms.

---

## Features

### Weather Monitoring
- **Real-time Weather Data**: Live observations from WeatherFlow Tempest station (updated every 3 minutes)
- **Accurate Daily Temperatures**: Database-driven calculations using actual observed data for precise daily high/low temperatures with exact timestamps
- **Comprehensive Metrics**: Temperature, wind speed/direction, barometric pressure, rainfall, humidity, UV index, lightning detection
- **Visual Indicators**: Animated wind compass with directional colors and speed-based effects
- **Live Weather Radar**: Embedded radar from Windy.com centered on your location
- **Lightning Detection**: Real-time lightning strike distance and timing alerts
- **Unit Preferences**: Automatic conversion between metric and imperial units

### Indoor Climate Control (Optional)
- **Multi-Thermostat Support**: Monitor multiple Ecobee thermostats via Beestat API
- **Real-time HVAC Status**: Live equipment state detection (heating/cooling/idle) with visual indicators
- **Smart Temperature Display**: Color-coded temperatures with pulsing animation during HVAC operation
- **Stale Data Detection**: "Delayed" indicator when thermostat data hasn't updated recently
- **Auto-Hide When Disabled**: Thermostat card automatically hides if no Beestat API key is configured
- **PostgreSQL Storage**: Reliable thermostat data storage with duplicate prevention

### Kiosk Optimization
- **Adaptive Layout**: Weather cards on left, live radar on right in landscape; stacked vertically in portrait
- **Auto-refresh**: Synchronized 3-minute updates for all data sources
- **Dark Theme**: Optimized for continuous display with minimal eye strain
- **Responsive Design**: Works from mobile phones to large displays
- **No User Interaction Required**: Designed for hands-off kiosk display

### Security & Privacy
- **Cloudflare Tunnel**: Secure internet access without opening firewall ports
- **Zero Trust Architecture**: Outbound-only connections, no public IP exposure
- **Automatic HTTPS**: SSL/TLS encryption managed by Cloudflare
- **DDoS Protection**: Built-in Cloudflare protection
- **End-to-end Encryption**: Secure traffic from Cloudflare edge to your server

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Wouter** for lightweight routing
- **TanStack Query** for server state management and caching
- **Vite** for development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **Drizzle ORM** with PostgreSQL
- **WeatherFlow API** integration
- **Beestat API** for Ecobee thermostat data

### Infrastructure
- **Docker & Docker Compose**: Containerized deployment
- **PostgreSQL 16**: Database for weather observations and thermostat data
- **Cloudflare Tunnel (cloudflared)**: Secure internet exposure
- **Auto-restart Policies**: Ensures services recover from failures

## Quick Start with Docker

### Prerequisites
- **Docker & Docker Compose** installed
- **WeatherFlow Tempest Station** with active data
- **WeatherFlow API Token** ([Get one here](https://tempestwx.com/settings/tokens))
- **Cloudflare Account** (optional, for secure internet access)
- **Beestat Account** (optional, for thermostat integration)

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/willcassell/weather-kiosk.git
   cd weather-kiosk
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Required variables:
   ```bash
   # WeatherFlow Configuration
   WEATHERFLOW_API_TOKEN=your_token_here
   WEATHERFLOW_STATION_ID=your_station_id

   # Radar Configuration
   VITE_RADAR_CENTER_LAT=37.000
   VITE_RADAR_CENTER_LON=-78.415
   VITE_RADAR_ZOOM_LEVEL=7.25

   # Database (auto-configured for Docker)
   DATABASE_URL=postgresql://weather_user:weather_pass_local@postgres:5432/weather_kiosk
   ```

   Optional variables:
   ```bash
   # Ecobee Thermostat Integration
   BEESTAT_API_KEY=your_beestat_key
   TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs

   # Cloudflare Tunnel (for internet access)
   CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
   ```

3. **Start the Application**
   ```bash
   docker compose up -d
   ```

4. **Access the Dashboard**
   - **Locally**: `http://localhost:5001`
   - **Over Internet** (if Cloudflare Tunnel configured): `https://your-domain.com`

5. **View Logs**
   ```bash
   docker compose logs -f app
   ```

## Architecture

### Docker Services

- **postgres**: PostgreSQL 16 database
  - Stores weather observations and thermostat data
  - Persistent volume for data retention
  - Health checks for reliable startup

- **app**: Weather Kiosk application
  - Node.js Express backend + React frontend
  - Listens on port 5000 (mapped to 5001 externally)
  - Auto-restarts on failure

- **grafana** (optional): Grafana Analytics & Dashboards
  - Data visualization and analytics platform
  - Pre-configured PostgreSQL datasource
  - Access at http://localhost:3000
  - Persistent dashboards and settings
  - Auto-restarts on failure

- **cloudflared** (optional): Cloudflare Tunnel
  - Secure internet exposure without open ports
  - Zero-trust network access
  - Auto-restarts on failure

### Data Flow

```
WeatherFlow API → Backend → PostgreSQL → Frontend
Beestat API → Backend → PostgreSQL → Frontend
Cloudflare Edge → Tunnel → App Container → User
```

## Secure Internet Access with Cloudflare Tunnel

### Why Cloudflare Tunnel?

- ✅ **No Open Ports**: No firewall configuration needed
- ✅ **Hidden IP Address**: Your home IP stays private
- ✅ **Automatic HTTPS**: SSL certificates managed by Cloudflare
- ✅ **DDoS Protection**: Built-in Cloudflare protection
- ✅ **Free for Personal Use**: No additional cost

### Setup Cloudflare Tunnel

1. **Create a Tunnel** in [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
   - Navigate to **Networks** → **Tunnels**
   - Click **"Create a tunnel"**
   - Choose **"Cloudflared"** connector
   - Name: `weather-kiosk`

2. **Get Your Tunnel Token**
   - Copy the token from the setup screen
   - Add to `.env`: `CLOUDFLARE_TUNNEL_TOKEN=your_token_here`

3. **Configure Public Hostname**
   - Subdomain: `weather`
   - Domain: `your-domain.com`
   - Type: `HTTP`
   - URL: `app:5000`

4. **Restart Services**
   ```bash
   docker compose up -d
   ```

Your weather kiosk is now securely accessible at `https://weather.your-domain.com`!

## Data Analytics with Grafana

The Weather Kiosk includes optional Grafana integration for advanced data visualization and historical analysis of your weather and thermostat data.

### What is Grafana?

Grafana is a powerful open-source analytics and monitoring platform that connects directly to your PostgreSQL database, allowing you to:

- **Visualize Historical Trends**: Graph temperature, humidity, pressure, and wind patterns over time
- **Compare Indoor vs Outdoor**: Correlate thermostat performance with outdoor conditions
- **Analyze Weather Patterns**: Identify trends in rainfall, pressure changes, and temperature variations
- **HVAC Efficiency**: Track heating/cooling runtime and energy patterns
- **Custom Time Ranges**: View data from hours to weeks with flexible zoom controls
- **Create Custom Dashboards**: Build your own visualizations with SQL queries

### Included Dashboard Panels

The pre-configured Weather Kiosk Overview dashboard includes:

1. **Current Conditions Gauges** (4 panels)
   - Temperature (color-coded: blue/green/yellow/orange/red)
   - Wind Speed with threshold indicators
   - Humidity percentage
   - Barometric Pressure

2. **24-Hour Trend Graphs** (4 panels)
   - Temperature Trends (current, feels like, dew point)
   - Wind Speed & Gusts
   - Humidity Over Time
   - Barometric Pressure Trends

3. **Historical Data** (2 panels)
   - Rainfall Accumulation (7 days)
   - Indoor vs Outdoor Temperature Comparison

4. **Thermostat Activity Table**
   - Recent HVAC state changes (color-coded: heating/cooling/idle)
   - Temperature vs target tracking

### Quick Start with Grafana

1. **Grafana is already configured in `docker-compose.yml`** - no additional setup needed!

2. **Set credentials in `.env`** (optional, defaults to admin/admin):
   ```bash
   GRAFANA_ADMIN_USER=admin
   GRAFANA_ADMIN_PASSWORD=your_secure_password
   ```

3. **Start Grafana with your stack**:
   ```bash
   docker compose up -d
   ```

4. **Access Grafana**:
   - Open: http://localhost:3000
   - Login with your credentials (default: admin/admin)
   - Navigate to **Dashboards** → **Weather Kiosk Overview**

### What Data is Available?

Grafana queries your PostgreSQL database tables:

**weather_observations** (7 days of raw data):
- Temperature, feels like, dew point, UV index
- Wind speed, gust, direction
- Humidity, barometric pressure
- Lightning strikes (count and distance)
- Rain accumulation per reading
- Individual timestamps for all measurements

**weather_data** (48 hours of processed data):
- Daily high/low temperatures with exact times
- Pressure trends (rising/falling/steady)
- Aggregated rain totals (today/yesterday)
- Wind direction in cardinal format (N, NE, etc.)

**thermostat_data** (unlimited history):
- Indoor temperature, target temperature
- HVAC mode (heat/cool/auto/off)
- HVAC state (heating/cooling/idle)
- Humidity levels
- Multi-thermostat tracking

### Creating Custom Queries

Grafana uses standard SQL to query your data. Here are some example queries you can use:

**Average temperature by hour over last 7 days:**
```sql
SELECT
  DATE_TRUNC('hour', timestamp) as time,
  AVG(temperature) as avg_temp
FROM weather_observations
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY time;
```

**Total rainfall per day:**
```sql
SELECT
  DATE_TRUNC('day', timestamp) as time,
  SUM(COALESCE(rain_accumulation, 0)) as daily_rain
FROM weather_observations
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY time;
```

**HVAC runtime percentage:**
```sql
SELECT
  mode,
  hvac_state,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM thermostat_data
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY mode, hvac_state;
```

### Grafana Configuration Files

All Grafana configuration is stored in the `grafana/` directory:

```
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── postgres.yml           # PostgreSQL connection
│   └── dashboards/
│       ├── dashboard-provider.yml # Dashboard auto-loading
│       └── weather-overview.json  # Pre-built dashboard
```

- **Datasource**: Auto-configured to connect to your PostgreSQL database
- **Dashboard**: Automatically loaded on first startup
- **Editable**: Modify dashboards in the UI, changes persist in the Grafana volume

### Tips for Using Grafana

- **Auto-refresh**: Set dashboard refresh to 30s or 1m for near real-time monitoring
- **Time Range Selector**: Use the top-right dropdown to adjust the time window
- **Panel Editing**: Click any panel title → Edit to customize queries and visualizations
- **Export/Import**: Share dashboards as JSON files
- **Alerts**: Configure alerts for temperature thresholds, HVAC failures, etc. (advanced)

### Troubleshooting Grafana

**Can't access Grafana at localhost:3000:**
- Check if container is running: `docker ps | grep grafana`
- View logs: `docker compose logs grafana`

**No data showing in panels:**
- Verify PostgreSQL has data: `docker compose exec postgres psql -U weather_user -d weather_kiosk -c "SELECT COUNT(*) FROM weather_observations;"`
- Check datasource connection: Grafana → Configuration → Data Sources → Test

**Dashboard not loading:**
- Check provisioning files exist in `grafana/provisioning/`
- Restart Grafana: `docker compose restart grafana`
- View provisioning logs: `docker compose logs grafana | grep provision`

## API Endpoints

### Weather Data
- `GET /api/weather/current` - Current weather conditions with daily extremes
- `GET /api/weather/history` - Historical weather data (48 hours)
- `GET /api/weather/observations` - Individual weather observations

### Thermostat Data
- `GET /api/thermostats/current` - Current thermostat readings
  - Returns: `{ thermostats: [], cached: boolean, stale: boolean, lastUpdated: string }`
  - Stale flag indicates data older than 5 minutes

## Configuration Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `WEATHERFLOW_API_TOKEN` | Yes | WeatherFlow API token |
| `WEATHERFLOW_STATION_ID` | Yes | Your station ID |
| `VITE_RADAR_CENTER_LAT` | Yes | Radar center latitude |
| `VITE_RADAR_CENTER_LON` | Yes | Radar center longitude |
| `VITE_RADAR_ZOOM_LEVEL` | Yes | Radar zoom level (default: 7.25) |
| `VITE_UNIT_SYSTEM` | Yes | Unit system: `imperial` or `metric` |
| `VITE_STATION_DISPLAY_NAME` | No | Custom station name (overrides API name) |
| `BEESTAT_API_KEY` | No | Beestat API key (thermostat card hidden if blank) |
| `TARGET_THERMOSTAT_NAMES` | No | Comma-separated thermostat names |
| `CLOUDFLARE_TUNNEL_TOKEN` | No | Cloudflare Tunnel token |
| `SESSION_SECRET` | No | Session encryption key (auto-generated) |
| `NODE_ENV` | No | Environment (production/development) |
| `PORT` | No | Server port (default: 5000) |
| `GRAFANA_ADMIN_USER` | No | Grafana admin username (default: admin) |
| `GRAFANA_ADMIN_PASSWORD` | No | Grafana admin password (default: admin) |

### Docker Compose Configuration

```yaml
services:
  postgres:    # PostgreSQL database
  app:         # Weather kiosk application
  grafana:     # Grafana analytics (optional)
  cloudflared: # Cloudflare Tunnel (optional)
```

All services have `restart: unless-stopped` for automatic recovery.

## Weather Card Components

1. **Top Banner**: Station information and last update timestamp
2. **Temperature Card**: Current, high, low with daily trends and times
3. **Wind Card**: Speed, direction with animated compass
4. **Pressure Card**: Barometric pressure with trend analysis
5. **Rainfall Card**: Today's and yesterday's precipitation
6. **Lightning Card**: Real-time lightning strike detection
7. **Humidity & Dew Point Card**: Atmospheric moisture data
8. **Thermostat Card**: Multi-location indoor climate with HVAC status and intelligent color-coding
9. **Live Radar**: Embedded weather radar

### Thermostat Card Color Coding

The thermostat card uses intelligent color-coding to provide at-a-glance status information:

#### Current Temperature Colors

**When HVAC is Active** (>1°F difference from target):
- 🔵 **Blue** - Actively cooling OR auto mode when temperature is above target
- 🔴 **Red** - Actively heating OR auto mode when temperature is below target
- Temperature will pulse to indicate active HVAC operation

**When HVAC is Idle** (<1°F difference):
- 🟢 **Green** - At target temperature (within 0.5°F)
- 🟠 **Orange** - Too warm (>1°F above target, needs cooling)
- 🔵 **Cyan** - Too cool (>1°F below target, needs heating)
- ⚪ **White** - Close to target (within 1°F range)

#### HVAC Status Indicators
- **Cooling**: Snowflake icon with activity indicator (blue, animated)
- **Heating**: Flame icon with activity indicator (red, animated)
- **Idle**: Pause icon (gray, static)
- **Delayed**: Yellow badge when data is stale (>5 minutes old)

This color-coding provides immediate visual feedback about:
- How close each thermostat is to its target temperature
- Whether the HVAC system is actively working
- Which direction adjustment is needed (warmer or cooler)

## Data Refresh & Caching

- **Weather Data**: Fetches every 3 minutes, cached for 2 minutes
- **Thermostat Data**: Fetches every 3 minutes, cached for 2 minutes
- **Stale Detection**: Thermostat data marked as "Delayed" if older than 5 minutes
- **Database Storage**: 7 days of observations, 48 hours of processed data

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL locally or update DATABASE_URL

# Run development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Development

```bash
# Rebuild after code changes
docker compose down
docker compose build
docker compose up -d

# View logs
docker compose logs -f
```

## Troubleshooting

### Port 5000 Already in Use
macOS AirPlay Receiver uses port 5000. The app is mapped to port 5001 externally.

### Tunnel Not Connecting
- Verify `CLOUDFLARE_TUNNEL_TOKEN` in `.env`
- Check logs: `docker compose logs cloudflared`
- Ensure public hostname is configured in Cloudflare dashboard

### Database Connection Issues
- Check PostgreSQL is running: `docker compose ps postgres`
- Verify health: `docker compose logs postgres`
- Check `DATABASE_URL` in `.env`

### Thermostat Data Stale
- Verify `BEESTAT_API_KEY` is valid
- Check target thermostat names match exactly
- Review logs: `docker compose logs app | grep thermostat`

## Production Deployment Checklist

- [ ] Update all environment variables in `.env`
- [ ] Generate secure `SESSION_SECRET`
- [ ] Configure Cloudflare Tunnel for internet access
- [ ] Set up database backups (if needed)
- [ ] Verify all services have `restart: unless-stopped`
- [ ] Test all API endpoints
- [ ] Verify Cloudflare DNS configuration
- [ ] Test stale data detection

## Security Best Practices

1. **Never commit `.env` file** - Contains sensitive tokens
2. **Use Cloudflare Tunnel** - Avoid opening firewall ports
3. **Rotate API tokens** - Periodically update WeatherFlow and Beestat tokens
4. **Monitor logs** - Watch for unauthorized access attempts
5. **Keep Docker images updated** - Run `docker compose pull` regularly

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Configure your personal environment variables (`.env`)
4. Make your changes
5. Test with your own weather station and API keys
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- All personal data must be parameterized via environment variables
- Never commit API keys, station IDs, or location data
- Test with real weather station data
- Follow existing TypeScript and React patterns
- Update documentation for new configuration options

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built with** ❤️ **for WeatherFlow Tempest enthusiasts**
**Secure internet access powered by Cloudflare Tunnel**
**Last Updated**: October 12, 2025
**Version**: 3.0.0 - Docker Deployment with Cloudflare Tunnel
