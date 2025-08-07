# WeatherFlow Tempest Weather Station Dashboard

A modern, kiosk-friendly weather monitoring application that displays real-time data from your WeatherFlow Tempest weather station with optional Ecobee thermostat integration. Built with React, TypeScript, and designed for continuous display on various screen sizes.

## Features

### Weather Monitoring  
- **Live Weather Data**: Real-time observations from your WeatherFlow Tempest station (not forecasts)
- **Accurate Daily Temperatures**: Database-driven calculations using actual observed data for precise daily high/low temperatures with exact timestamps
- **Weather Observations Database**: Stores every individual weather reading for historical accuracy and trend analysis
- **Comprehensive Metrics**: Temperature, wind speed/direction, barometric pressure, rainfall, humidity, UV index, lightning detection
- **Visual Indicators**: Animated wind compass with directional colors and speed-based effects  
- **Weather Radar**: Embedded live radar from Windy.com centered on your location
- **Lightning Detection**: Real-time lightning strike distance and timing alerts
- **Unit Conversions**: Automatic conversion from metric to imperial units

### Indoor Climate Control (Optional)
- **Multi-Location Support**: Monitor multiple Ecobee thermostats via Beestat API
- **HVAC Activity Indicators**: Visual indicators show when heating/cooling is active vs idle
- **Smart Temperature Display**: Color-coded temperatures with pulsing animation during HVAC operation
- **Configurable Thermostats**: Target specific thermostats by name from your Ecobee system

### Kiosk Optimization
- **Adaptive Layout**: Weather cards on left, live radar on right in landscape; stacked vertically in portrait
- **No User Interaction**: Designed for hands-off kiosk display
- **Auto-refresh**: Synchronized 3-minute updates for all data sources
- **Dark Theme**: Optimized for continuous display with minimal eye strain
- **Responsive Design**: Works from mobile phones to large displays

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **Vite** for development and building

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules  
- **Drizzle ORM** with PostgreSQL (optional, uses in-memory storage by default)
- **WeatherFlow API** integration with observations endpoint
- **Beestat API** for Ecobee thermostat data

### Database
- **PostgreSQL Database** for accurate weather observations and temperature calculations
- **Weather Observations Storage**: Every individual weather reading stored with timestamps for precise daily calculations
- **Automatic Schema Management**: Tables created automatically on startup
- **Data Retention**: 7 days of detailed observations, 48 hours of processed weather history  
- **Fallback Storage**: In-memory storage if database unavailable
- **Session Management**: PostgreSQL-based session storage for authentication

## Quick Start

### Prerequisites
- **WeatherFlow Tempest Station** with active data
- **WeatherFlow Developer Account** for API access
- **Node.js 18+**  
- **Beestat Account** (optional, for thermostat integration)

### Setup Steps

1. **Get Your WeatherFlow API Token**
   - Visit [WeatherFlow Tempest Settings](https://tempestwx.com/settings/tokens)
   - Create a personal access token
   - Note your station ID from the Tempest app

2. **Clone and Configure**
   ```bash
   git clone https://github.com/yourusername/weather-dashboard.git
   cd weather-dashboard
   cp .env.example .env
   # Edit .env with your API token, station ID, and location coordinates
   ```

3. **Install and Run**
   ```bash
   npm install
   npm run dev
   ```

4. **Access Dashboard**  
   Open `http://localhost:5000`

For detailed setup instructions including thermostat integration and deployment, see [SETUP.md](./SETUP.md).

## Configuration

All personal data is configured via environment variables for easy sharing and deployment:

- **WEATHERFLOW_API_TOKEN** - Your WeatherFlow personal access token
- **WEATHERFLOW_STATION_ID** - Your specific weather station ID  
- **VITE_RADAR_CENTER_LAT/LON** - Coordinates to center the radar display
- **BEESTAT_API_KEY** - API key for thermostat integration (optional)
- **TARGET_THERMOSTAT_NAMES** - Comma-separated list of thermostats to display

See `.env.example` for complete configuration options.

## API Endpoints

### Weather Data
- `GET /api/weather/current` - Current weather conditions with database-calculated daily extremes
- `GET /api/weather/history` - Historical weather data (48 hours)
- `GET /api/weather/observations` - Individual weather observations for analysis

### Thermostat Control
- `GET /api/thermostats/current` - Current thermostat readings from Beestat API

## Data Sources

### WeatherFlow Tempest Station
- **Personalized Configuration**: Configure your specific station ID in environment variables
- **API**: WeatherFlow Observations API for real-time data (not forecasts)
- **Database Storage**: Every observation stored for accurate historical calculations
- **Daily Temperature Accuracy**: High/low temperatures calculated from actual observed data with precise timing
- **Update Frequency**: Every 3 minutes synchronized refresh with database persistence

### Ecobee Thermostats (Optional)
- **Multi-Thermostat Support**: Configure which thermostats to display by name
- **API**: Beestat API for reliable Ecobee data access
- **Features**: Temperature, humidity, HVAC mode, target temperature with visual indicators

## Weather Card Components

1. **Top Banner**: Station information and last update timestamp
2. **Temperature Card**: Current, high, and low temperatures with daily trends
3. **Wind Card**: Speed, direction with animated compass and color-coded indicators
4. **Pressure Card**: Barometric pressure with trend analysis
5. **Rainfall Card**: Today's and yesterday's precipitation totals
6. **Lightning Card**: Real-time lightning strike detection with distance and timing
7. **Humidity & Dew Point Card**: Essential atmospheric moisture data
8. **Thermostat Card**: Multi-location indoor climate control with HVAC status
9. **Live Radar**: Embedded weather radar centered on your location

## Visual Features

### Wind Direction Animation
- **Color-coded compass**: N=red, E=yellow, S=blue, W=green
- **Bouncing arrow**: Points to current wind direction
- **Speed indicators**: Ping animations based on wind speed
- **Wind descriptions**: Calm, Light Air, Light Breeze, etc.

### Temperature Indicators
- **Outdoor temperatures**: Celsius to Fahrenheit conversion
- **Indoor readings**: Current vs target with color coding
- **HVAC modes**: 🔥 Heat, ❄️ Cool, 🎯 Auto, ⏸️ Off

### Pressure Visualization
- **Gauge display**: High/medium/low indicators
- **Trend arrows**: Rising, falling, or steady pressure
- **Millibars to inches**: Automatic unit conversion

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions for all configuration options
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide for various platforms
- **[.env.example](./.env.example)** - Template for environment variables configuration

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Configure your personal environment variables (copy `.env.example` to `.env`)
4. Make your changes
5. Test with your own weather station and API keys
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- All personal data must be parameterized via environment variables
- Never commit API keys, station IDs, or location data
- Test with real weather station data, not mock data
- Follow the existing TypeScript and React patterns
- Update documentation for any new configuration options

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use with WeatherFlow Tempest station ID 38335.

---

**Last Updated**: August 7, 2025  
**Version**: 2.1.0 with Database-Driven Weather Observations
