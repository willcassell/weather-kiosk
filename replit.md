# WeatherFlow Tempest Weather Station Dashboard

## Overview
This project is a modern weather monitoring application that displays real-time data from a WeatherFlow Tempest weather station. It fetches data from the WeatherFlow API and presents it in an intuitive dashboard featuring weather cards, live radar, and automatic updates. The application aims to provide a comprehensive and user-friendly interface for weather information.

## User Preferences
Preferred communication style: Simple, everyday language.

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

## External Dependencies

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