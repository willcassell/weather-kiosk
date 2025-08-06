# WeatherFlow Tempest Weather Dashboard - Setup Guide

This guide will help you configure the weather dashboard for your specific WeatherFlow Tempest station and optional Ecobee thermostats.

## Prerequisites

1. **WeatherFlow Tempest Weather Station** - You need an active Tempest station
2. **WeatherFlow Developer Account** - For API access
3. **Beestat Account** (Optional) - For Ecobee thermostat integration
4. **Node.js 18+** - For running the application

## Step 1: WeatherFlow API Setup

### Get Your Personal Access Token
1. Visit [WeatherFlow Tempest Settings](https://tempestwx.com/settings/tokens)
2. Login to your Tempest account
3. Click "Create Token" 
4. Name it something like "Weather Dashboard"
5. Copy the generated token

### Find Your Station ID
1. In your Tempest mobile app, go to Settings
2. Select your station
3. Note the Station ID (numeric value)
4. Alternatively, you can find it in the WeatherFlow web interface URL

## Step 2: Geographic Configuration

### Get Your Coordinates
1. Visit [LatLong.net](https://www.latlong.net/) or use Google Maps
2. Find your location and note the latitude and longitude
3. These will center the weather radar on your area

## Step 3: Beestat Setup (Optional - for Ecobee Integration)

### Create Beestat Account
1. Visit [Beestat.io](https://beestat.io)
2. Connect your Ecobee account
3. Wait for initial data sync (can take 24-48 hours)

### Get API Access
1. Go to [Beestat Account Settings](https://beestat.io/account)
2. Generate an API key
3. Copy the key for configuration

### Identify Your Thermostats
1. In the Beestat interface, note the exact names of your thermostats
2. These names must match exactly what appears in your Ecobee app
3. Examples: "Downstairs", "Main Floor", "Bedroom Thermostat"

## Step 4: Environment Configuration

### Create .env File
1. Copy `.env.example` to `.env`
2. Fill in your specific values:

```bash
# WeatherFlow Configuration
WEATHERFLOW_API_TOKEN=your_actual_token_here
WEATHERFLOW_STATION_ID=your_station_id_here

# Geographic Location (for radar centering)
VITE_RADAR_CENTER_LAT=37.000
VITE_RADAR_CENTER_LON=-78.415
VITE_RADAR_ZOOM_LEVEL=7.25

# Beestat Configuration (optional)
BEESTAT_API_KEY=your_beestat_key_here
TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs,Main Floor

# Database (optional - defaults to in-memory)
DATABASE_URL=postgresql://user:password@host:port/database

# App Configuration
NODE_ENV=development
PORT=5000
```

### Environment Variable Details

**WEATHERFLOW_API_TOKEN**: Your personal access token from Tempest
**WEATHERFLOW_STATION_ID**: Your station's numeric ID
**VITE_RADAR_CENTER_LAT/LON**: Coordinates for radar center
**VITE_RADAR_ZOOM_LEVEL**: Zoom level for radar (3-12, higher = more zoomed in)
**BEESTAT_API_KEY**: Your Beestat API key (optional)
**TARGET_THERMOSTAT_NAMES**: Comma-separated list of thermostat names to display
**DATABASE_URL**: PostgreSQL connection string (optional, uses memory storage if not provided)

## Step 5: Installation and Startup

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### For Production Deployment
```bash
npm run build
npm start
```

## Step 6: Verification

### Check Weather Data
- Verify temperature matches your Tempest app
- Confirm wind, pressure, humidity readings are accurate
- Check that lightning shows "None" when no activity

### Check Thermostat Data (if configured)
- Verify thermostat names and temperatures appear correctly
- Check that target temperatures and modes are accurate
- Confirm readings match your Ecobee app

### Check Radar
- Verify radar is centered on your location
- Adjust VITE_RADAR_CENTER_LAT/LON if needed
- Modify VITE_RADAR_ZOOM_LEVEL for better coverage

## Troubleshooting

### Weather Data Issues
- **"Weather Data Error"**: Check your WEATHERFLOW_API_TOKEN
- **Wrong location data**: Verify your WEATHERFLOW_STATION_ID
- **No data**: Ensure your Tempest station is online and reporting

### Thermostat Issues
- **"No thermostat data available"**: Check BEESTAT_API_KEY
- **Wrong thermostats shown**: Verify TARGET_THERMOSTAT_NAMES spelling
- **Incorrect readings**: Wait 24-48 hours for Beestat sync

### Radar Issues
- **Wrong location**: Adjust VITE_RADAR_CENTER_LAT and VITE_RADAR_CENTER_LON
- **Too zoomed in/out**: Modify VITE_RADAR_ZOOM_LEVEL

## Kiosk Mode Setup

For dedicated weather display devices:

### Raspberry Pi Configuration
1. Install Chromium in kiosk mode
2. Set screen to not sleep
3. Auto-start browser to your dashboard URL
4. Configure screen rotation if needed

### Browser Settings
- Enable full screen mode (F11)
- Disable screen savers
- Set as homepage/startup page

## Support

For issues with:
- **WeatherFlow API**: [WeatherFlow Support](https://help.tempest.earth)
- **Beestat API**: [Beestat Community](https://community.beestat.io)
- **Dashboard Issues**: Check application logs and verify environment variables