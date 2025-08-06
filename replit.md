# WeatherFlow Tempest Weather Station Dashboard

## Overview
This project is a modern weather monitoring application that displays real-time data from a WeatherFlow Tempest weather station. It fetches data from the WeatherFlow API and presents it in an intuitive dashboard featuring weather cards, live radar, and automatic updates. The application aims to provide a comprehensive and user-friendly interface for weather information.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 2025)
- **GitHub Documentation Preparation**: Completed comprehensive documentation overhaul for public sharing
- **Environment Variable Parameterization**: All personal data (API keys, station IDs, coordinates) moved to environment variables
- **Lightning Card Enhancement**: Replaced visibility with lightning strike detection and timing
- **Humidity/Dew Point Card**: Split bottom row to show both lightning activity and essential atmospheric data
- **Setup Guides**: Created detailed SETUP.md, DEPLOYMENT.md, and CONTRIBUTING.md for community use
- **Data Accuracy**: Switched to WeatherFlow observations API for exact temperature matching with Tempest app
- **Production Ready**: All hardcoded personal data removed, ready for GitHub sharing

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom weather-themed color variables, default dark theme optimized for weather monitoring, and custom animations.
- **Build Tool**: Vite
- **UI System**: Designed with "new-york" style configuration, mobile-first responsive design using CSS orientation media queries, and dynamic font scaling.
- **Key Components**: TopBanner, TemperatureCard, WindCard, PressureCard, RainfallCard, AdditionalDataCard, and RadarDisplay (embedded Windy.com).

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL-based session storage with `connect-pg-simple`
- **Development Server**: Custom Vite integration for seamless full-stack development.
- **API Polling**: Server polls WeatherFlow API every 3 minutes, transforming and storing data.
- **Client Updates**: Frontend polls for updates every 3 minutes to display real-time data.
- **Thermostat Integration**: Integration with Beestat API for Ecobee thermostat readings, with secure API key authentication, data conversion, HVAC state detection, and multi-thermostat support. Includes a framework for HomeKit device integration.

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
- `DATABASE_URL`: PostgreSQL connection string (optional, uses in-memory if not provided)