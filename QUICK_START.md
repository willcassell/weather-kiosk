# WeatherFlow Tempest Weather Kiosk - Quick Start Guide

Deploy your own weather kiosk display in 5 minutes using Docker.

## What You Need

### Required
- ✅ Docker & Docker Compose ([Download](https://docs.docker.com/get-docker/))
- ✅ WeatherFlow Tempest Station with active data
- ✅ WeatherFlow API Token ([Get yours](https://tempestwx.com/settings/tokens))
- ✅ Your Station ID (found in Tempest app)
- ✅ Your Location Coordinates ([Find them](https://www.latlong.net/))

### Optional
- 🔹 Ecobee Thermostat + Beestat Account (for indoor climate)
- 🔹 Cloudflare Account (for secure internet access)

---

## Quick Start

### 1. Download

```bash
git clone https://github.com/yourusername/weather-kiosk.git
cd weather-kiosk
```

### 2. Configure

```bash
cp .env.example .env
nano .env   # or use any text editor
```

**Edit these required fields in `.env`:**

```bash
# Your WeatherFlow Credentials (REQUIRED)
WEATHERFLOW_API_TOKEN=paste_your_token_here
WEATHERFLOW_STATION_ID=your_station_id

# Your Location for Radar (REQUIRED)
VITE_RADAR_CENTER_LAT=37.000
VITE_RADAR_CENTER_LON=-78.415

# Units: "imperial" or "metric" (REQUIRED)
VITE_UNIT_SYSTEM=imperial

# Generate a secure session secret (REQUIRED)
SESSION_SECRET=$(openssl rand -hex 32)
```

**Optional: Custom Station Name**
```bash
VITE_STATION_DISPLAY_NAME=My Home Weather Station
```

**Optional: Indoor Climate (Ecobee Thermostats)**
```bash
BEESTAT_API_KEY=your_beestat_api_key
TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs
```
*Leave blank to disable the thermostat card*

### 3. Launch

```bash
docker compose up -d
```

### 4. Access

Open your browser to: **http://localhost:5001**

Done! Your weather data will appear within 3 minutes.

---

## Configuration Details

### Unit Systems

**Imperial (US Standard)**
```bash
VITE_UNIT_SYSTEM=imperial
```
- Fahrenheit (°F)
- Miles per hour (MPH)
- Inches (in)
- Inches of mercury (inHg)

**Metric**
```bash
VITE_UNIT_SYSTEM=metric
```
- Celsius (°C)
- Kilometers per hour (km/h)
- Millimeters (mm)
- Millibars (mb)

### Indoor Climate (Optional)

The thermostat card **automatically hides** if you don't configure a Beestat API key.

**To enable indoor climate monitoring:**

1. Link your Ecobee account to Beestat at https://beestat.io
2. Get your API key at https://beestat.io/account
3. Add to `.env`:
   ```bash
   BEESTAT_API_KEY=your_api_key_here
   TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs
   ```
4. Rebuild:
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```

### Secure Internet Access (Optional)

Access your kiosk from anywhere using Cloudflare Tunnel (no open ports needed):

1. Create tunnel at https://one.dash.cloudflare.com/ → Networks → Tunnels
2. Get your tunnel token
3. Add to `.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=your_token_here
   ```
4. Configure public hostname:
   - Service: `app`
   - Port: `5000`
   - Type: `HTTP`
5. Restart: `docker compose restart`

Access at: `https://weather.your-domain.com`

---

## Common Issues

### "Port 5000 already in use"
This is normal on macOS (AirPlay uses port 5000). The app uses port 5001 externally.

### "No weather data"
1. Check your WeatherFlow API token and station ID
2. View logs: `docker compose logs app`
3. Restart: `docker compose restart app`

### "Thermostat card not showing"
This is normal if you haven't set a Beestat API key. The card auto-hides when disabled.

### "Database connection failed"
```bash
docker compose down
docker compose up -d
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f app

# Restart after config changes
docker compose down
docker compose up -d

# Rebuild after changing VITE_* variables
docker compose down
docker compose build
docker compose up -d

# Stop everything
docker compose down

# Update to latest version
git pull
docker compose down
docker compose build
docker compose up -d
```

---

## Displaying on a Kiosk Device

### Chrome Kiosk Mode
```bash
chromium-browser --kiosk http://localhost:5001
```

### Firefox Kiosk Mode
```bash
firefox --kiosk http://localhost:5001
```

### Raspberry Pi Auto-start

```bash
# Install Chromium
sudo apt-get install chromium-browser unclutter

# Create startup script
cat > ~/start-kiosk.sh << 'EOF'
#!/bin/bash
xset s off
xset -dpms
xset s noblank
unclutter -idle 0.5 -root &
chromium-browser --kiosk --noerrdialogs http://localhost:5001
EOF

chmod +x ~/start-kiosk.sh

# Add to autostart
mkdir -p ~/.config/lxsession/LXDE-pi
echo "@/home/pi/start-kiosk.sh" >> ~/.config/lxsession/LXDE-pi/autostart
```

---

## Features Included

✅ Real-time weather from your Tempest station
✅ Live auto-playing radar
✅ Daily temperature highs/lows with exact times
✅ Wind speed/direction with animated compass
✅ Barometric pressure trends
✅ Rainfall tracking
✅ Lightning detection
✅ Humidity & dew point
✅ Indoor climate (optional)
✅ Automatic unit conversion
✅ Dark theme optimized for 24/7 display
✅ Responsive (mobile to large displays)
✅ Auto-refresh every 3 minutes

---

## Security Best Practices

1. ⚠️ **Never commit your `.env` file** (contains sensitive API keys)
2. 🔐 Use strong session secrets: `openssl rand -hex 32`
3. 🌐 Use Cloudflare Tunnel for internet access (don't open ports)
4. 🔄 Rotate API keys periodically
5. 📦 Keep Docker images updated: `docker compose pull`

---

## Get Help

- **Full Documentation**: [README.md](./README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/weather-kiosk/issues)
- **WeatherFlow Support**: https://help.weatherflow.com/
- **Beestat Support**: https://beestat.io/

---

**Version**: 3.0.0
**Last Updated**: October 12, 2025
**Built for**: WeatherFlow Tempest enthusiasts
