# Deployment Guide

This guide covers deploying the WeatherFlow Tempest Weather Dashboard to various platforms.

## Environment Variables for Production

Ensure all production environment variables are set:

```bash
# Required - WeatherFlow API
WEATHERFLOW_API_TOKEN=your_production_token
WEATHERFLOW_STATION_ID=your_station_id

# Required - Geographic Configuration
VITE_RADAR_CENTER_LAT=your_latitude
VITE_RADAR_CENTER_LON=your_longitude
VITE_RADAR_ZOOM_LEVEL=7.25

# Optional - Thermostat Integration  
BEESTAT_API_KEY=your_beestat_key
TARGET_THERMOSTAT_NAMES=thermostat1,thermostat2

# Production Database (recommended)
DATABASE_URL=postgresql://user:pass@host:port/db

# Production Settings
NODE_ENV=production
PORT=5000
```

## Replit Deployment

### Using Replit Deployments
1. Ensure all environment variables are configured in Replit Secrets
2. Click "Deploy" in your Repl
3. Choose "Autoscale" for production workloads
4. Configure custom domain if desired

### Environment Setup in Replit
1. Go to your Repl's "Secrets" tab
2. Add each environment variable from `.env.example`
3. Use the actual values for your setup

## Railway Deployment

### Setup
```bash
npm install -g @railway/cli
railway login
railway init
```

### Configuration
```bash
# Set environment variables
railway variables set WEATHERFLOW_API_TOKEN=your_token
railway variables set WEATHERFLOW_STATION_ID=your_id
railway variables set VITE_RADAR_CENTER_LAT=your_lat
railway variables set VITE_RADAR_CENTER_LON=your_lon
railway variables set BEESTAT_API_KEY=your_key
railway variables set TARGET_THERMOSTAT_NAMES="thermostat1,thermostat2"

# Deploy
railway up
```

## Vercel Deployment

### Setup
```bash
npm install -g vercel
vercel login
```

### Configuration
1. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ]
}
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

## Digital Ocean App Platform

### app.yaml Configuration
```yaml
name: weather-dashboard
services:
- name: api
  source_dir: /
  github:
    repo: your-username/weather-dashboard
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: WEATHERFLOW_API_TOKEN
    value: your_token
  - key: WEATHERFLOW_STATION_ID
    value: your_id
  - key: VITE_RADAR_CENTER_LAT
    value: your_lat
  - key: VITE_RADAR_CENTER_LON  
    value: your_lon
  - key: BEESTAT_API_KEY
    value: your_key
  - key: TARGET_THERMOSTAT_NAMES
    value: thermostat1,thermostat2
  - key: NODE_ENV
    value: production
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  weather-dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - WEATHERFLOW_API_TOKEN=${WEATHERFLOW_API_TOKEN}
      - WEATHERFLOW_STATION_ID=${WEATHERFLOW_STATION_ID}
      - VITE_RADAR_CENTER_LAT=${VITE_RADAR_CENTER_LAT}
      - VITE_RADAR_CENTER_LON=${VITE_RADAR_CENTER_LON}
      - BEESTAT_API_KEY=${BEESTAT_API_KEY}
      - TARGET_THERMOSTAT_NAMES=${TARGET_THERMOSTAT_NAMES}
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=production
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=weather
      - POSTGRES_USER=weather
      - POSTGRES_PASSWORD=your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Home/Local Network Deployment

### Raspberry Pi Setup
1. Install Node.js 18+
2. Clone repository
3. Create `.env` file with your settings
4. Install dependencies: `npm install`
5. Build application: `npm run build` 
6. Start with PM2: `pm2 start npm --name weather-dashboard -- start`

### Systemd Service (Linux)
Create `/etc/systemd/system/weather-dashboard.service`:
```ini
[Unit]
Description=Weather Dashboard
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/weather-dashboard
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable weather-dashboard
sudo systemctl start weather-dashboard
```

## Database Setup (Production)

### PostgreSQL (Recommended)
1. Create database and user
2. Set `DATABASE_URL` environment variable
3. Application will auto-create tables

### Neon (Serverless PostgreSQL)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`

## Monitoring and Maintenance

### Health Checks
The application provides a health endpoint:
- `GET /api/health` - Returns application status

### Log Monitoring
Monitor these key log messages:
- "Data is stale - Fetching fresh weather data"
- "Using cached thermostat data" vs "Refreshing thermostat data"
- API error messages

### Performance
- Weather data refreshes every 3 minutes
- Thermostat data refreshes every 3 minutes
- Database queries are optimized for recent data

## Security Considerations

### API Key Security
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate API keys periodically

### Network Security
- Use HTTPS in production
- Consider IP whitelisting for internal deployments
- Enable CORS only for your domain

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups for production databases

## Scaling Considerations

### Single Instance
- Suitable for personal/family use
- Handles 10-50 concurrent users
- 512MB RAM recommended

### Multiple Instances
- Use load balancer for high availability
- Shared database across instances
- Consider Redis for session storage

## Backup and Recovery

### Configuration Backup
- Backup `.env` file securely
- Document all custom settings
- Version control all code changes

### Data Backup
- Weather data: 48-hour retention (automatic)
- Thermostat data: Consider longer retention
- Database backups if using persistent storage