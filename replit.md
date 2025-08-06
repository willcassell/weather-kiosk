# WeatherFlow Tempest Weather Station Dashboard

## Overview

This is a modern weather monitoring application that displays real-time data from a WeatherFlow Tempest weather station. The application fetches data from the WeatherFlow API and presents it in an intuitive dashboard with weather cards, live radar, and automatic updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom weather-themed color variables
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple
- **Development Server**: Custom Vite integration for seamless full-stack development

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless database
- **Fallback Storage**: In-memory storage implementation for development
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Data Retention**: Weather history maintained for 48 hours

## Key Components

### Weather Dashboard Components
1. **TopBanner**: Station info and last update timestamp
2. **TemperatureCard**: Current, high, and low temperatures
3. **WindCard**: Wind speed, direction with compass visualization
4. **PressureCard**: Barometric pressure with trend indicators
5. **RainfallCard**: Today's and yesterday's precipitation
6. **AdditionalDataCard**: Humidity, UV index, and visibility
7. **RadarDisplay**: Embedded Windy.com live weather radar

### Data Layer
- **WeatherData Schema**: Comprehensive weather metrics storage
- **Storage Interface**: Abstracted storage layer supporting multiple backends
- **API Integration**: WeatherFlow Tempest API client with error handling

### UI System
- **Design System**: shadcn/ui with "new-york" style configuration
- **Dark Theme**: Default dark theme optimized for weather monitoring
- **Responsive Design**: Mobile-first approach with breakpoint handling
- **Custom Animations**: Weather-specific visual indicators and loading states

## Data Flow

1. **API Polling**: Server polls WeatherFlow API every 3 minutes
2. **Data Transformation**: Raw API data converted to normalized schema
3. **Storage**: Weather data saved with automatic history management
4. **Client Updates**: Frontend polls for updates every 3 minutes
5. **Real-time Display**: Live data visualization with trend indicators

### WeatherFlow API Integration
- **Endpoint**: Better forecast API for current conditions
- **Authentication**: Token-based authentication (multiple env var options)
- **Data Processing**: Wind direction conversion, pressure trend calculation
- **Error Handling**: Graceful fallback for API failures

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **date-fns**: Date formatting and manipulation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **wouter**: Lightweight router

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type safety
- **tsx**: TypeScript execution
- **esbuild**: Fast bundling for production

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **API Tokens**: WeatherFlow API authentication (multiple naming options)
- **NODE_ENV**: Environment detection for development features

### Production Considerations
- **Static Serving**: Express serves built frontend assets
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Performance**: Query caching, optimized bundle sizes, and efficient re-renders
- **Monitoring**: Request logging and response time tracking

### Development Features
- **HMR**: Hot module replacement via Vite
- **Error Overlay**: Runtime error display in development
- **Replit Integration**: Banner and cartographer for Replit environment
- **Live Reloading**: Automatic server restart on changes

## Recent Changes (August 6, 2025)

### Synchronized Data Updates and Scrollbar Removal (August 6, 2025)
- **Synchronized Updates**: Thermostat data now refreshes automatically whenever weather data is updated (every 3 minutes)
- **UI Spacing Fixes**: Fixed thermostat card center divider positioning with proper buffer space from target temperature and humidity data
- **Pressure Gauge Enhancement**: Shortened pressure gauge bar to 4/5 width and repositioned higher with better spacing from legend labels
- **Scrollbar Removal**: Completely removed scrollbars for true kiosk mode - page now auto-scales to fit any screen size without scrolling
- **Layout Optimization**: Updated main layout to use full viewport height with proper flex containers for perfect screen fitting
- **Real Data Integration**: Both Home (Downstairs) and Lake (809 Sailors Cove) thermostats now display actual temperature readings from Beestat API

## Recent Changes (August 6, 2025)

### Orientation-Based Responsive Layout (August 6, 2025)
- **Orientation Detection**: Replaced screen-width breakpoints with CSS orientation media queries
- **Landscape Layout**: Cards display side-by-side when screen is wider than tall (landscape orientation)
- **Portrait Layout**: Cards stack vertically when screen is taller than wide (portrait orientation)  
- **Dynamic Adaptation**: Layout automatically adjusts when device is rotated or window resized
- **Font Scaling Enhancement**: Typography now scales based on both orientation and screen size for optimal readability
- **Cross-Device Compatibility**: Works seamlessly from rotated phones to ultrawide monitors

### Temperature Reset Fix (August 6, 2025)
- **Midnight Reset Issue**: Fixed temperature high/low not resetting at midnight due to timezone handling
- **Local Timezone Support**: Updated date calculations to use local timezone instead of UTC for proper daily reset
- **Enhanced Filtering**: Improved logic to ensure only today's temperatures are considered for high/low calculations

### Beestat API Integration (August 6, 2025)
- **Real Thermostat Data**: Integrated with Beestat API to fetch actual Ecobee thermostat readings
- **API Key Authentication**: Added secure BEESTAT_API_KEY environment variable for authentication
- **Data Conversion**: Automatic conversion from Beestat decidegrees to Fahrenheit display format
- **HVAC State Detection**: Intelligent detection of heating/cooling activity from thermostat state
- **Graceful Fallback**: Falls back to HomeKit simulation if Beestat API unavailable
- **Multi-Thermostat Support**: Handles multiple thermostats with proper location naming (Downstairs → Home, 809 Sailors Cove → Lake)

## Recent Changes (August 5, 2025)

### Responsive Layout and Vertical Centering (August 5, 2025)
- **Mobile-First Responsive Design**: Implemented mobile-first layout that stacks cards vertically on phones and displays side-by-side on larger screens
- **Breakpoint-Based Font Scaling**: Added Tailwind breakpoint-based responsive typography that scales up from mobile to desktop:
  - Mobile: Standard text sizes (text-xs, text-sm, text-lg, etc.)
  - Large screens (lg): Increased by one size level
  - Extra large (xl): Increased by two size levels  
  - 2XL screens: Increased by three size levels for optimal readability
- **Adaptive Layout Structure**: Main layout uses `flex-col lg:flex-row` for mobile stacking with horizontal split on large screens
- **Vertical Centering System**: Implemented `.weather-card-content` wrapper that centers all card content vertically using flexbox
- **Responsive Icons**: All icons scale consistently across breakpoints (h-4 w-4 to h-7 w-7) for better visibility on larger displays
- **Enhanced Card Structure**: Updated all weather cards to use consistent header-content layout with proper vertical centering
- **Mobile Optimization**: Cards maintain readability on small screens while scaling appropriately for kiosk displays
- **Wind Direction Fix**: Corrected compass arrow rotation from +45° to -45° offset to properly align with cardinal directions

### Production Deployment Fixes (August 5, 2025)
- **Database Configuration**: Added PostgreSQL storage implementation with Neon serverless support and graceful fallback to memory storage
- **Environment Variables**: Proper handling of DATABASE_URL, SESSION_SECRET, PORT, and NODE_ENV with comprehensive validation
- **Session Management**: Configured PostgreSQL session store for production with memory store fallback for development
- **Error Handling**: Enhanced server startup with comprehensive error handling, graceful shutdown, and detailed logging
- **Health Monitoring**: Added `/api/health` endpoint for deployment verification with database status and system metrics
- **Database Initialization**: Automatic table creation and migration system for weather_data, thermostat_data, and session tables
- **Deployment Scripts**: Created migration script and deployment configuration with environment variable validation
- **Host Binding**: Configured server to listen on 0.0.0.0 for container deployment compatibility
- **Production Documentation**: Comprehensive deployment guide with platform-specific instructions and troubleshooting

### Temperature Timestamp Enhancement (August 5, 2025)
- **High/Low Time Tracking**: Added database fields and logic to track when daily high and low temperatures were observed
- **Timestamp Display**: Temperature card now shows time (e.g., "3:24 PM") when each high/low was recorded
- **Improved Data Flow**: Enhanced weather data processing to find actual temperature extremes with their observation times
- **Better User Experience**: Users can now see exactly when temperature peaks occurred during the day

### Responsive Layout Optimization (August 5, 2025)
- **Dynamic Height Adjustment**: Weather cards and radar now automatically fill available screen space
- **Equal Bottom Alignment**: Cards and radar maintain consistent bottom edge regardless of display size
- **Wind/Rain Row Layout**: Combined wind and rain cards on same row with 2/3 and 1/3 width split respectively
- **Vertical Rain Display**: Changed rain card to show today above yesterday, both right-aligned
- **Improved Space Utilization**: Better use of horizontal space while maintaining responsive design

### Data Refresh Improvements (August 5, 2025)
- **Faster Updates**: Reduced weather data cache time from 10 minutes to 3 minutes
- **Force Refresh Option**: Added ability to force immediate data refresh via URL parameter
- **Better Synchronization**: Weather readings now stay closer to actual Tempest website values
- **Enhanced Logging**: Improved server-side logging for data freshness tracking

## Recent Changes (August 4, 2025)

### Space Optimization Updates
- **Additional Data Card**: Redesigned to display all 4 values (Humidity, UV Index, Visibility, Dew Point) in a single row with dividers for maximum space efficiency
- **Compact Layout**: Smaller text sizing while maintaining readability for kiosk displays

### HomeKit Thermostat Integration (August 4, 2025)
- **Location-Specific Thermostats**: Updated to show "Home" and "Lake" locations instead of generic room names
- **Intuitive HVAC Status**: Clear visual indicators showing when HVAC is actively heating/cooling vs idle
- **Smart Activity Detection**: Temperature pulsing and animated icons when HVAC is running (cooling 74°F → 72°F target)
- **Realistic Simulation**: Time-based temperature variations and HVAC cycling behavior that mimics actual thermostat operation
- **HomeKit Integration Path**: Created framework for real HomeKit device integration as alternative to Ecobee API (suspended March 2024)

### Visual Enhancements
- **HVAC Status Indicators**: 
  - Animated snowflake + activity icon when cooling
  - Animated flame + activity icon when heating  
  - Pause icon when idle
- **Temperature Color Coding**: Dynamic colors based on HVAC activity and temperature differential from target
- **Professional Layout**: Clean three-column layout (Location/Status | Current Temp | Target/Humidity)

### Technical Infrastructure
- **HomeKit Discovery Service**: Built extensible HomeKit device simulation with realistic HVAC behavior patterns
- **Documentation**: Added comprehensive HOMEKIT_INTEGRATION.md guide for real device integration
- **API Improvements**: Enhanced error handling and fallback systems for thermostat data

### Previous Changes (July 23, 2025)

### Critical Unit Conversion Fixes
- **Temperature Conversion**: Fixed WeatherFlow API returning Celsius values while displaying Fahrenheit labels - added automatic C to F conversion
- **Pressure Conversion**: Fixed pressure readings showing millibars instead of inches of mercury - added mb to inHg conversion  
- **Wind Speed Conversion**: Added meters per second to miles per hour conversion for accurate wind readings

### Kiosk Layout Optimizations
- **Compact Weather Cards**: Reduced padding and spacing for better space utilization on kiosk displays
- **Visual Enhancements**: Added compass rose for wind direction and pressure gauge with high/medium/low indicators
- **Layout Improvements**: Implemented 50/50 split with weather cards on left, live radar on right half

### Documentation Updates
- **Comprehensive README**: Created detailed README.md with setup instructions, API documentation, and troubleshooting guide
- **Feature Documentation**: Complete coverage of weather monitoring, thermostat integration, and kiosk optimization
- **Developer Guide**: Architecture overview, deployment instructions, and contribution guidelines