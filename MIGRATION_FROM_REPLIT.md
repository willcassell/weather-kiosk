# Migration from Replit to Local Docker Environment

This document details the migration of the Weather-Kiosk project from Replit to a local Docker-based environment.

## Migration Date
October 12, 2025

## Summary of Changes

### 1. Database Migration
**From:** Neon Serverless PostgreSQL (WebSocket-based)
**To:** Standard PostgreSQL 16 (running in Docker)

#### Files Modified:
- `server/db.ts` - Replaced `@neondatabase/serverless` with `pg` driver
- `server/db-init.ts` - Updated to use standard `pg.Pool` instead of Neon HTTP client
- `package.json` - Removed `@neondatabase/serverless`, `ws`, added `pg`

#### Key Changes:
```typescript
// OLD (Neon):
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// NEW (Standard PostgreSQL):
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
```

### 2. Replit-Specific Dependencies Removed
- `@replit/vite-plugin-cartographer` - Removed from devDependencies
- `@replit/vite-plugin-runtime-error-modal` - Removed from devDependencies and vite.config.ts
- `@types/ws` - No longer needed

### 3. Docker Containerization
**New Files Created:**
- `Dockerfile` - Node.js 18 Alpine-based container for the application
- `docker-compose.yml` - Orchestrates PostgreSQL and app containers
- `.dockerignore` - Excludes unnecessary files from Docker build

#### Container Architecture:
- **postgres** - PostgreSQL 16 Alpine container with persistent volume storage
- **app** - Node.js application container with health checks and auto-restart

### 4. Configuration Changes
- **Port Change:** 5000 → 5001 (to avoid conflict with macOS Control Center/AirPlay)
- **Database URL:** Now points to containerized PostgreSQL at `postgres:5432`
- **Environment Variables:** All configured in `.env` file

### 5. Path Resolution Fixes
Fixed ES module `import.meta.dirname` issues in bundled production code:
- `server/vite.ts` - Changed to `process.cwd()` for production compatibility
- Vite config import made conditional (only loaded in development mode)

## New Project Structure

```
weather-kiosk/
├── Dockerfile                 # Application container definition
├── docker-compose.yml         # Multi-container orchestration
├── .dockerignore             # Docker build exclusions
├── .env                      # Local environment configuration (git-ignored)
├── .env.example              # Template for environment variables
├── server/
│   ├── db.ts                 # Standard PostgreSQL connection
│   ├── db-init.ts            # Database initialization with pg
│   └── vite.ts               # Production-compatible path resolution
└── package.json              # Updated dependencies
```

## Running the Application

### Prerequisites
- Docker and Docker Compose installed
- WeatherFlow API credentials
- (Optional) Beestat API key for Ecobee integration

### Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Rebuild after code changes
docker compose down && docker compose build && docker compose up -d

# Access application
open http://localhost:5001
```

### Database Management

```bash
# Connect to PostgreSQL
docker exec -it weather-kiosk-db psql -U weather_user -d weather_kiosk

# View tables
docker exec weather-kiosk-db psql -U weather_user -d weather_kiosk -c "\dt"

# Backup database
docker exec weather-kiosk-db pg_dump -U weather_user weather_kiosk > backup.sql

# Restore database
cat backup.sql | docker exec -i weather-kiosk-db psql -U weather_user -d weather_kiosk
```

## Configuration

### Environment Variables (.env)
```bash
# Database (managed by docker-compose)
DATABASE_URL=postgresql://weather_user:weather_pass_local@postgres:5432/weather_kiosk

# Application
NODE_ENV=production
PORT=5001

# WeatherFlow API (Required)
WEATHERFLOW_API_TOKEN=your_token_here
WEATHERFLOW_STATION_ID=your_station_id

# Radar Display (Required)
VITE_RADAR_CENTER_LAT=37.000
VITE_RADAR_CENTER_LON=-78.415
VITE_RADAR_ZOOM_LEVEL=7.25

# Beestat/Ecobee (Optional)
BEESTAT_API_KEY=your_key_here
TARGET_THERMOSTAT_NAMES=Downstairs,Upstairs

# Security
SESSION_SECRET=auto_generated_secret
```

## Key Differences from Replit

### What Changed:
1. **Database:** Local PostgreSQL instead of Neon serverless
2. **Port:** 5001 instead of 5000 (macOS compatibility)
3. **Deployment:** Docker containers instead of Replit runtime
4. **Dependencies:** Standard `pg` driver instead of Neon WebSocket client
5. **Build:** Standard Docker build process instead of Replit auto-build

### What Stayed the Same:
1. All application code (frontend & backend logic)
2. API endpoints and routes
3. Database schema (identical tables)
4. WeatherFlow and Beestat API integrations
5. React frontend and styling

## Troubleshooting

### Port 5000 Already in Use
**Cause:** macOS Control Center uses port 5000 for AirPlay
**Solution:** We changed to port 5001 (already done)

### Database Connection Failed
**Check:** Ensure PostgreSQL container is healthy
```bash
docker compose ps
# Look for "healthy" status on postgres container
```

### Application Won't Start
**Check logs:**
```bash
docker compose logs app --tail=50
```

**Common fixes:**
```bash
# Rebuild containers
docker compose down && docker compose build && docker compose up -d

# Clean rebuild (removes volumes)
docker compose down -v && docker compose build && docker compose up -d
```

### API Not Returning Data
**Verify credentials in `.env`:**
- WEATHERFLOW_API_TOKEN
- WEATHERFLOW_STATION_ID
- BEESTAT_API_KEY (if using thermostats)

## Performance Notes

### Database Performance
- **Persistent storage:** Data survives container restarts via Docker volume
- **Connection pooling:** Using `pg` Pool for efficient connections
- **7-day retention:** Weather observations stored for historical accuracy

### Container Resource Usage
- **PostgreSQL:** ~30MB RAM, minimal CPU
- **Application:** ~100MB RAM, minimal CPU during normal operation
- **Storage:** ~50MB for application, ~100MB for database (grows with data)

## Future Enhancements

Potential improvements for local development:

1. **Development Mode:** Create `docker-compose.dev.yml` with hot-reload support
2. **Monitoring:** Add Prometheus/Grafana for metrics
3. **Backup Automation:** Automated daily database backups
4. **SSL/HTTPS:** Add reverse proxy (nginx/Caddy) for HTTPS
5. **Multi-Environment:** Separate configs for dev/staging/production

## Rollback to Replit (If Needed)

To revert back to Replit:
1. Push current code to git (without Docker files)
2. In Replit, revert these files to Replit versions:
   - `server/db.ts`
   - `server/db-init.ts`
   - `package.json`
   - `vite.config.ts`
3. Update DATABASE_URL to Neon connection string
4. Change PORT back to 5000
5. Run `npm install` to restore Replit dependencies

## Migration Success Verification

✅ **Completed Successfully:**
- [x] Docker containers built and running
- [x] PostgreSQL database initialized with all tables
- [x] Application starts without errors
- [x] Web server accessible at http://localhost:5001
- [x] Database tables created (weather_data, weather_observations, thermostat_data, session)
- [x] API credentials configured
- [x] All Replit dependencies removed

## Support

For issues or questions:
- Check Docker logs: `docker compose logs`
- Verify environment variables in `.env`
- Ensure Docker daemon is running
- Check port availability: `lsof -i :5001`

---

**Migration Completed:** October 12, 2025
**Migrated By:** Claude Code
**Status:** ✅ Production Ready
