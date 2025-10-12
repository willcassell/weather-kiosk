# Weather-Kiosk Docker Quick Start Guide

## Quick Commands

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild after code changes
docker compose down && docker compose build && docker compose up -d

# View application
open http://localhost:5001
```

## First Time Setup (Already Done)

The project is already configured and ready to run. Your `.env` file contains:
- ✅ WeatherFlow API credentials
- ✅ Beestat API key
- ✅ Radar coordinates
- ✅ Database connection string

## Current Status

**Containers Running:**
- `weather-kiosk-app` - Application server (port 5001)
- `weather-kiosk-db` - PostgreSQL database (port 5432)

**Access Points:**
- **Web Dashboard:** http://localhost:5001
- **API:** http://localhost:5001/api/weather/current

## Database Access

```bash
# Connect to database
docker exec -it weather-kiosk-db psql -U weather_user -d weather_kiosk

# View tables
docker exec weather-kiosk-db psql -U weather_user -d weather_kiosk -c "\dt"

# Check weather data
docker exec weather-kiosk-db psql -U weather_user -d weather_kiosk -c "SELECT COUNT(*) FROM weather_observations;"
```

## Useful Commands

### Container Management
```bash
# Check container status
docker compose ps

# Restart a specific service
docker compose restart app

# View resource usage
docker stats weather-kiosk-app weather-kiosk-db

# Remove everything (including volumes)
docker compose down -v
```

### Logs and Debugging
```bash
# Follow all logs
docker compose logs -f

# Just application logs
docker compose logs -f app

# Just database logs
docker compose logs -f postgres

# Last 50 lines
docker compose logs app --tail=50
```

### Backup and Restore
```bash
# Backup database
docker exec weather-kiosk-db pg_dump -U weather_user weather_kiosk > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20251012.sql | docker exec -i weather-kiosk-db psql -U weather_user -d weather_kiosk
```

## Environment Configuration

Edit `.env` file to change:
- API credentials
- Radar center coordinates
- Port numbers
- Database settings

After changing `.env`, restart containers:
```bash
docker compose down && docker compose up -d
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker compose logs app

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database Connection Issues
```bash
# Check if database is healthy
docker compose ps

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

### Port Already in Use
If port 5001 is in use:
1. Edit `docker-compose.yml` - change `5001:5000` to `5002:5000`
2. Edit `.env` - change `PORT=5001` to `PORT=5002`
3. Restart: `docker compose down && docker compose up -d`

## Development Workflow

### Making Code Changes
1. Edit code in your IDE
2. Rebuild and restart:
   ```bash
   docker compose down
   docker compose build
   docker compose up -d
   ```
3. View logs to verify: `docker compose logs -f app`

### Adding Dependencies
1. Edit `package.json`
2. Rebuild container:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

## Production Checklist

Before deploying to production:
- [ ] Change `SESSION_SECRET` in `.env` to a strong random value
- [ ] Update `DATABASE_URL` if using external database
- [ ] Review `NODE_ENV=production` setting
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Enable HTTPS/SSL

## Performance Tips

### Optimize for Low Resource Usage
```yaml
# Add to docker-compose.yml under 'app' service:
mem_limit: 256m
cpus: 0.5
```

### Speed Up Builds
```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker compose build
```

## More Information

- See `MIGRATION_FROM_REPLIT.md` for detailed migration documentation
- See `.env.example` for all configuration options
- See `README.md` for feature documentation

---

**Quick Access:**
- Dashboard: http://localhost:5001
- Health Check: http://localhost:5001/api/weather/current
- Database: `psql postgresql://weather_user:weather_pass_local@localhost:5432/weather_kiosk`
