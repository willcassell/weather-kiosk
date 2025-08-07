# Kiosk Configuration Guide

This guide covers setting up the weather dashboard for kiosk deployment with fixed configuration.

## Environment-Based Configuration

The weather dashboard is designed for kiosk deployment where configuration is set once via environment variables rather than user interaction.

### Unit System Configuration

Units are controlled by the `VITE_UNIT_SYSTEM` environment variable:

```bash
# Imperial units (default)
VITE_UNIT_SYSTEM=imperial
# - Temperature: Fahrenheit (°F)
# - Wind speed: miles per hour (mph)
# - Pressure: inches of Mercury (inHg)
# - Precipitation: inches (in)
# - Distance: miles (mi)

# Metric units
VITE_UNIT_SYSTEM=metric
# - Temperature: Celsius (°C)
# - Wind speed: kilometers per hour (km/h)
# - Pressure: hectoPascals (hPa)
# - Precipitation: millimeters (mm)
# - Distance: kilometers (km)
```

### Display Configuration

The dashboard automatically adapts to screen orientation:

**Landscape Mode (recommended for kiosks):**
- Weather cards on the left half
- Live radar on the right half
- Optimized for tablets and larger displays

**Portrait Mode:**
- Weather cards stacked vertically
- Radar below weather data
- Works on phones and vertical displays

### Kiosk Deployment Considerations

1. **No User Interaction**: All settings are environment-controlled
2. **Auto-refresh**: Data updates every 3 minutes automatically
3. **Dark Theme**: Optimized for continuous display
4. **Error Handling**: Graceful fallbacks for API failures
5. **Responsive Design**: Adapts to various screen sizes

### Production Environment Setup

For kiosk deployment, set these environment variables:

```bash
# Required - Weather data
WEATHERFLOW_API_TOKEN=your_token
WEATHERFLOW_STATION_ID=your_station_id

# Required - Geographic location
VITE_RADAR_CENTER_LAT=your_latitude
VITE_RADAR_CENTER_LON=your_longitude
VITE_RADAR_ZOOM_LEVEL=7.25

# Required - Unit system
VITE_UNIT_SYSTEM=imperial  # or 'metric'

# Optional - Thermostat integration
BEESTAT_API_KEY=your_key
TARGET_THERMOSTAT_NAMES=thermostat1,thermostat2

# Optional - Database (uses in-memory if not provided)
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Testing Unit Conversion

To test metric units in development:

```bash
# Set environment variable and restart
export VITE_UNIT_SYSTEM=metric
npm run dev
```

The dashboard will immediately display:
- Temperatures in Celsius
- Wind speeds in km/h
- Pressure in hPa
- Precipitation in mm
- Distances in km

### Deployment Platforms

The dashboard works on various platforms:

- **Replit Deployments**: Set environment variables in Secrets
- **Railway**: Use environment variable configuration
- **Vercel**: Configure in project settings
- **Docker**: Pass environment variables at runtime
- **Self-hosted**: Export variables before starting

All configuration is done via environment variables for maximum flexibility across deployment platforms.