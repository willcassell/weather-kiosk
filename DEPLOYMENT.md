# Weather Kiosk Deployment Guide

## Overview

This guide provides comprehensive deployment instructions for the Weather Kiosk application, including all the necessary environment variables, database setup, and deployment configurations required for successful production deployment.

## Applied Deployment Fixes

The following deployment issues have been resolved:

### ✅ Environment Variables Configuration
- **DATABASE_URL**: Properly handled with fallback to in-memory storage
- **SESSION_SECRET**: Configured with secure defaults and production warnings
- **PORT**: Set to listen on 0.0.0.0 with proper port binding for Cloud Run
- **NODE_ENV**: Environment detection for production vs development features

### ✅ Database Connection Handling
- Added PostgreSQL storage implementation with Neon serverless support
- Implemented connection error handling with graceful fallback to memory storage
- Created database initialization script with table creation
- Added session table setup for connect-pg-simple

### ✅ Server Configuration Improvements
- Enhanced server startup with comprehensive error handling
- Added proper host binding (0.0.0.0) for container deployment
- Implemented graceful shutdown handling (SIGTERM/SIGINT)
- Added detailed logging for deployment troubleshooting

### ✅ Health Check Endpoint
- Added `/health` endpoint for deployment monitoring
- Includes database connection status, uptime, and system metrics
- Provides deployment verification and troubleshooting information

### ✅ Session Management
- Configures PostgreSQL session store for production
- Falls back to memory store for development
- Handles session store initialization errors gracefully

## Required Environment Variables

### Production Deployment
```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
SESSION_SECRET=your-secure-random-session-secret
PORT=5000
NODE_ENV=production
```

### Optional API Configuration
```bash
WEATHERFLOW_API_TOKEN=your-weatherflow-api-token
ECOBEE_API_KEY=your-ecobee-api-key
```

## Database Setup

### Automatic Migration
The application will automatically create necessary database tables on startup:
- `weather_data`: Weather station data storage
- `thermostat_data`: Thermostat readings
- `session`: Session storage for user authentication

### Manual Migration
To run migrations manually:
```bash
tsx scripts/migrate.js
```

## Deployment Process

### 1. Build Application
```bash
npm run build
```

### 2. Environment Setup
Set all required environment variables in your deployment platform.

### 3. Database Configuration
Ensure your PostgreSQL database is accessible and the DATABASE_URL is correct.

### 4. Start Application
```bash
npm start
```

### 5. Health Check
Verify deployment with:
```bash
curl http://your-domain/api/health
```

## Platform-Specific Instructions

### Replit Deployments
1. Set environment variables in the Deployments pane (not just Secrets)
2. Ensure DATABASE_URL points to your Neon database
3. Add SESSION_SECRET with a secure random value
4. The application will automatically handle port binding

### Cloud Run / Container Platforms
- The application listens on 0.0.0.0:${PORT}
- Handles SIGTERM for graceful shutdown
- Includes health check endpoint for load balancer probes

### Traditional VPS/Server
- Set NODE_ENV=production
- Configure reverse proxy (nginx/apache) if needed
- Ensure database connectivity

## Troubleshooting

### Database Connection Issues
1. Check DATABASE_URL format and accessibility
2. Verify database exists and credentials are correct
3. Application will fall back to memory storage if database fails

### Session Store Issues
- Application continues without sessions if store initialization fails
- Check PostgreSQL connectivity for session persistence

### Port Binding Issues
- Ensure PORT environment variable is set correctly
- Application defaults to port 5000
- Verify firewall settings allow traffic on the specified port

## Health Check Response
The `/api/health` endpoint provides:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-05T00:54:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "database": true,
  "memory": {...},
  "version": "v20.x.x",
  "port": "5000",
  "lastWeatherUpdate": "2025-08-05T00:53:00.000Z"
}
```

## Security Considerations

### Production Checklist
- [ ] SESSION_SECRET is set to a secure random value
- [ ] DATABASE_URL uses SSL connection
- [ ] NODE_ENV is set to "production"
- [ ] API tokens are stored securely
- [ ] HTTPS is configured (handled by deployment platform)

### Development vs Production
- Development: Uses memory storage and session store
- Production: Uses PostgreSQL for data and session persistence
- Secure cookies enabled automatically in production mode

## Performance Optimization

### Database
- Indexes created automatically for weather_data queries
- Session cleanup handled by connect-pg-simple
- Weather data limited to 48-hour retention

### Caching
- Weather data cached for 3 minutes
- Database connection pooling via Neon serverless
- Static assets served with appropriate cache headers

## Monitoring

### Key Metrics
- Health check endpoint status
- Database connection health
- Weather data freshness
- Memory usage and uptime

### Logging
- Structured logging for API requests
- Database connection status
- Weather data refresh cycles
- Error handling with detailed context