# WeatherFlow Tempest Weather Station Dashboard

A modern, kiosk-friendly weather monitoring application that displays real-time data from a WeatherFlow Tempest weather station with integrated Ecobee thermostat support.

## Features

### Weather Monitoring
- **Live Weather Data**: Real-time updates from WeatherFlow Tempest station (ID: 38335)
- **Comprehensive Metrics**: Temperature, wind speed/direction, barometric pressure, rainfall, humidity, UV index
- **Visual Indicators**: Animated wind compass with directional colors and speed-based effects
- **Weather Radar**: Embedded live radar from Windy.com
- **Unit Conversions**: Automatic conversion from metric to imperial units

### Indoor Climate Control
- **Dual Location Support**: Monitor thermostats at "Home" and "Lake" locations
- **HVAC Activity Indicators**: Visual indicators show when heating/cooling is active vs idle
- **Smart Temperature Display**: Color-coded temperatures with pulsing animation during HVAC operation
- **HomeKit Integration**: Designed for HomeKit thermostat integration (Ecobee API suspended March 2024)

### Kiosk Optimization
- **50/50 Layout**: Weather cards on left, live radar on right for optimal screen utilization
- **No User Interaction**: Designed for hands-off kiosk display
- **Auto-refresh**: Updates every 3 minutes automatically
- **Dark Theme**: Optimized for continuous display

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
- **Drizzle ORM** with PostgreSQL
- **WeatherFlow API** integration
- **Ecobee API** with OAuth 2.0

### Database
- **PostgreSQL** via Neon serverless
- **48-hour data retention** for weather history
- **Session-based authentication storage**

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- WeatherFlow API token
- Ecobee developer account with API key

### Environment Variables
Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@host/database

# WeatherFlow API (use any one of these variable names)
WEATHERFLOW_API_TOKEN=your_weatherflow_token
WEATHERFLOW_TOKEN=your_weatherflow_token
WF_TOKEN=your_weatherflow_token

# Thermostat Integration (Optional - currently using HomeKit simulation)
ECOBEE_API_KEY=your_ecobee_api_key  # Only if you have existing API access
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weatherflow-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Configure Ecobee thermostats**
   - Visit `/thermostat-auth` in your browser
   - Follow the PIN-based authentication process
   - Enter the PIN on ecobee.com when prompted

## API Endpoints

### Weather Data
- `GET /api/weather/current` - Current weather conditions
- `GET /api/weather/history` - Historical weather data (48 hours)

### Thermostat Control
- `GET /api/thermostats/current` - Current thermostat readings
- `GET /api/thermostats/auth/status` - Authentication status
- `POST /api/thermostats/auth/start` - Initiate PIN-based auth
- `POST /api/thermostats/auth/complete` - Complete authentication

## Data Sources

### WeatherFlow Tempest Station
- **Station ID**: 38335
- **Location**: Cornville, AZ
- **API**: WeatherFlow Better Forecast API
- **Update Frequency**: Every 3 minutes

### Ecobee Thermostats
- **Living Room Thermostat**: Primary climate zone
- **Bedroom Thermostat**: Secondary climate zone
- **API**: Ecobee API v1 with OAuth 2.0
- **Features**: Temperature, humidity, HVAC mode, target temperature

## Weather Card Components

1. **Top Banner**: Station information and last update timestamp
2. **Temperature Card**: Current, high, and low temperatures with trends
3. **Wind Card**: Speed, direction with animated compass and color-coded indicators
4. **Pressure Card**: Barometric pressure with trend arrows
5. **Rainfall Card**: Today's and yesterday's precipitation totals
6. **Additional Data**: Humidity, UV index, visibility, and dew point
7. **Thermostat Card**: Indoor temperatures from both locations
8. **Live Radar**: Embedded weather radar display

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

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup
- Set `NODE_ENV=production`
- Configure database connection
- Ensure API keys are properly set
- Enable HTTPS for OAuth callbacks

### Kiosk Configuration
- Set display to full-screen mode
- Disable screen saver and power management
- Configure auto-start on boot
- Use landscape orientation for optimal layout

## Development

### Project Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route components
│   └── lib/             # Utility functions
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── ecobee-api.ts    # Ecobee integration
│   └── storage.ts       # Database interface
├── shared/              # Shared TypeScript schemas
└── docs/                # Documentation
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Apply database schema changes
- `npm run db:studio` - Open database admin interface

## Weather Data Processing

### Unit Conversions
- **Temperature**: Celsius → Fahrenheit (°C × 9/5 + 32)
- **Wind Speed**: m/s → mph (m/s × 2.237)
- **Pressure**: millibars → inches of mercury (mb × 0.02953)

### Data Retention
- Weather readings stored for 48 hours
- Automatic cleanup of old records
- Efficient querying with indexed timestamps

## Authentication Flow

### Ecobee OAuth 2.0 Process
1. Request authorization with PIN generation
2. User enters PIN on ecobee.com
3. Exchange authorization code for access tokens
4. Automatic token refresh before expiration
5. Secure storage of credentials in database

## Troubleshooting

### Common Issues
- **No weather data**: Check WeatherFlow API token
- **Thermostat errors**: Verify Ecobee API key and authentication
- **Database connection**: Confirm DATABASE_URL is correct
- **Build failures**: Ensure Node.js 18+ is installed

### Debug Endpoints
- Visit `/thermostat-auth` for authentication status
- Check browser console for client-side errors
- Review server logs for API failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for personal use with WeatherFlow Tempest station ID 38335.

---

**Last Updated**: July 23, 2025  
**Version**: 2.0.0 with Ecobee Integration