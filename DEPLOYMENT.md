# Deployment Guide

## Quick Deploy to Replit

1. **Fork this repository** on GitHub
2. **Import to Replit** by connecting your GitHub account
3. **Set environment variables** in Replit Secrets:
   - `WEATHERFLOW_API_TOKEN` - Your WeatherFlow API token
   - `DATABASE_URL` - PostgreSQL database URL (provided by Replit)
   - `ECOBEE_API_KEY` - (Optional) If you have existing Ecobee API access

4. **Run the project**: The workflow will automatically install dependencies and start the server

## Environment Variables

### Required
- `WEATHERFLOW_API_TOKEN` - Get from [WeatherFlow Developers](https://tempestwx.com/settings/tokens)
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `ECOBEE_API_KEY` - Only if you have existing Ecobee API access (new registrations suspended)
- `NODE_ENV` - Set to `production` for production deployment

## Database Setup

The application automatically:
1. Creates necessary database tables using Drizzle migrations
2. Sets up PostgreSQL session storage
3. Maintains weather history with automatic cleanup

## Thermostat Integration

### Current Status
- **HomeKit Simulation**: Working realistic data for "Home" and "Lake" locations
- **Real Integration**: See `THERMOSTAT_SETUP.md` for connecting actual thermostats

### Next Steps for Real Data
1. **HomeKit + Home Assistant** (Recommended)
2. **Alternative APIs** (Nest, Honeywell)
3. **Direct integration** with your smart thermostat platform

## Production Deployment

### Option 1: Replit Deployments (Easy)
1. Click "Deploy" in Replit
2. Configure custom domain if needed
3. Set production environment variables

### Option 2: Docker Deployment
```bash
# Build the application
npm run build

# Run with Docker
docker build -t weather-kiosk .
docker run -p 5000:5000 --env-file .env weather-kiosk
```

### Option 3: Traditional VPS
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start dist/index.js --name weather-kiosk
```

## Monitoring

The application includes:
- Request logging
- Error tracking
- API response time monitoring
- Weather data freshness checks

## Scaling Considerations

- **Database**: Uses connection pooling for PostgreSQL
- **Caching**: Weather data cached for 3-minute intervals
- **Static Assets**: Served efficiently via Express
- **Memory**: Optimized for long-running kiosk displays

## Troubleshooting

### Common Issues
1. **Weather data not loading**: Check WeatherFlow API token
2. **Thermostat errors**: Review `THERMOSTAT_SETUP.md`
3. **Database connection**: Verify `DATABASE_URL` format
4. **Port conflicts**: Application uses port 5000 by default

### Logs
Check application logs for detailed error information:
```bash
# Replit Console
# PM2 logs: pm2 logs weather-kiosk
# Docker logs: docker logs <container_id>
```

## Support

- **Issues**: Create GitHub issues for bugs or feature requests
- **Documentation**: All setup guides included in repository
- **Integration Help**: Thermostat-specific setup instructions provided