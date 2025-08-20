# WeatherFlow Tempest Weather Station Dashboard

## Overview
This project is a modern weather monitoring application that displays real-time data from a WeatherFlow Tempest weather station. It fetches data from the WeatherFlow API and presents it in an intuitive dashboard featuring weather cards, live radar, and automatic updates. The application aims to provide a comprehensive and user-friendly interface for weather information.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- **PostgreSQL Cost Optimization**: Implemented comprehensive cost reduction strategy with in-memory caching and off-peak scheduling (10 PM - 6 AM) to minimize database compute time and reduce billing costs
- **Smart Caching Layer**: Added intelligent caching system with different TTL values for peak (2-3 min) vs off-peak hours (8-10 min) to serve data from memory instead of database queries
- **Off-Peak Scheduling**: Automatic detection of off-peak hours with reduced API polling frequency - weather updates every 8 minutes and thermostat updates every 5 minutes during 10 PM to 6 AM period
- **Dynamic Refresh Intervals**: Frontend adapts polling based on time of day - maintains real-time experience during peak hours while reducing costs during off-peak periods
- **Database Activity Reduction**: Strategic use of cached data and extended refresh intervals during low-usage hours to allow PostgreSQL database to go idle and reduce compute costs
- **Real-Time Lightning Detection Enhancement**: Fixed lightning timestamp logic to use actual WeatherFlow observation timestamps instead of server time, ensuring accurate lightning activity display within 30-minute windows
- **Daily Temperature Reset Fix**: Fixed timezone issue where daily high/low temperatures were resetting at 8:00 PM instead of midnight by implementing proper Eastern timezone handling with daylight saving time detection
- **Real-time Thermostat Updates**: Enhanced thermostat data refresh system to show immediate updates on dashboard when background polling detects changes, eliminating delays in displaying current HVAC status
- **Database Storage Reliability**: Fixed PostgreSQL thermostat storage to properly replace old records instead of creating duplicates, ensuring data consistency
- **HVAC State Detection**: Enhanced thermostat status accuracy using actual equipment state from Beestat API, correctly showing cooling/heating/idle status
- **Weather Observations Database**: Implemented PostgreSQL storage for individual weather readings with accurate daily temperature calculations from observed data only
- **Visual Improvements**: Rain card units now display as small superscripts, humidity values reduced in size as secondary information
- **Kiosk-Focused Unit System**: Removed interactive settings UI, units now controlled via VITE_UNIT_SYSTEM environment variable
- **Parameterized Station Display**: Station name in banner now configurable via VITE_STATION_DISPLAY_NAME environment variable
- **Simplified Banner Display**: Removed station ID from banner, showing only the custom station name
- **Comprehensive Unit System**: Implemented complete imperial/metric conversion system with user preferences
- **Unit Preferences UI**: Added settings modal with quick presets (Imperial/Metric) and individual unit controls
- **Real-time Conversion**: All weather components now support dynamic unit conversion (temperature, wind, pressure, precipitation)
- **Persistent Settings**: User unit preferences saved to localStorage with graceful fallbacks
- **GitHub Documentation Preparation**: Completed comprehensive documentation overhaul for public sharing
- **Environment Variable Parameterization**: All personal data (API keys, station IDs, coordinates) moved to environment variables
- **Lightning Card Enhancement**: Replaced visibility with lightning strike detection and timing
- **Humidity/Dew Point Card**: Split bottom row to show both lightning activity and essential atmospheric data
- **Setup Guides**: Created detailed SETUP.md, DEPLOYMENT.md, and CONTRIBUTING.md for community use
- **Data Accuracy**: Switched to WeatherFlow observations API for exact temperature matching with Tempest app
- **Production Ready**: All hardcoded personal data removed, ready for GitHub sharing
- **GitHub Repository**: Successfully published to public repository with complete documentation

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom weather-themed color variables, default dark theme optimized for weather monitoring, and custom animations.
- **Build Tool**: Vite
- **UI System**: Designed with "new-york" style configuration, mobile-first responsive design using CSS orientation media queries, and dynamic font scaling.
- **Unit System**: Comprehensive imperial/metric conversion controlled by VITE_UNIT_SYSTEM environment variable. Supports temperature (°F/°C), wind speed (mph/km/h/m/s/knots), pressure (inHg/hPa/mmHg/kPa), distance (mi/km), and precipitation (in/mm). Designed for kiosk deployment without user interaction.
- **Key Components**: TopBanner, TemperatureCard, WindCard, PressureCard, RainfallCard, AdditionalDataCard, RadarDisplay (embedded Windy.com), and UnitSettings modal.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL-based session storage with `connect-pg-simple`
- **Development Server**: Custom Vite integration for seamless full-stack development.
- **API Polling**: Server polls WeatherFlow API every 3 minutes, transforming and storing data.
- **Client Updates**: Frontend polls for updates every 3 minutes to display real-time data.
- **Thermostat Integration**: Integration with Beestat API for Ecobee thermostat readings, with secure API key authentication, data conversion, HVAC state detection, and multi-thermostat support.

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless database
- **Fallback Storage**: In-memory storage for development
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Data Retention**: Weather history maintained for 48 hours.
- **Data Flow**: API polling, data transformation, storage with automatic history management, and client updates for real-time display.

### System Design Choices
- **Layout**: Adaptive layout structure with cards displaying side-by-side in landscape and stacking vertically in portrait orientation. Uses flexbox for vertical centering within cards.
- **Kiosk Mode**: Designed for kiosk displays with compact layouts, optimized space utilization, and consistent scaling of icons. Includes dynamic height adjustment for cards and radar.
- **Error Handling**: Graceful fallback for API failures and comprehensive server-side error handling.

## External Dependencies & APIs

### Weather Data
- **WeatherFlow Tempest API**: Real-time weather observations and lightning data
- **Windy.com Embed**: Interactive weather radar display

### Thermostat Integration  
- **Beestat API**: Access to Ecobee thermostat data with multi-device support

### Core Libraries
- **@neondatabase/serverless**: Neon PostgreSQL driver
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **date-fns**: Date formatting and manipulation

### UI Libraries
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **wouter**: Lightweight router

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution
- **esbuild**: Fast bundling for production

## Configuration Parameters

### Environment Variables (Production Ready)
All personal data is parameterized through environment variables:
- `WEATHERFLOW_API_TOKEN`: Personal access token for WeatherFlow API
- `WEATHERFLOW_STATION_ID`: Specific weather station identifier  
- `BEESTAT_API_KEY`: API key for thermostat data access
- `TARGET_THERMOSTAT_NAMES`: Comma-separated list of thermostat names to display
- `VITE_RADAR_CENTER_LAT/LON`: Geographic coordinates for radar centering
- `VITE_RADAR_ZOOM_LEVEL`: Radar map zoom level
- `VITE_UNIT_SYSTEM`: Set to 'metric' or 'imperial' to control all unit displays (default: imperial)
- `VITE_STATION_DISPLAY_NAME`: Custom name for your weather station (appears in top banner)
- `VITE_WEATHERFLOW_STATION_ID`: Station ID for frontend display (copy of WEATHERFLOW_STATION_ID)
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory if not provided)