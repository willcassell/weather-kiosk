#!/bin/bash

# Deployment script for the Weather Kiosk application
set -e

echo "Starting deployment process..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL is not set. The application will use in-memory storage."
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "WARNING: SESSION_SECRET is not set. Using default session secret (not recommended for production)."
fi

echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-5000}"
echo "Database URL configured: ${DATABASE_URL:+true}"
echo "Session secret configured: ${SESSION_SECRET:+true}"

# Build the application
echo "Building application..."
npm run build

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    tsx scripts/migrate.js || {
        echo "WARNING: Database migration failed. Application may still work with fallback storage."
    }
else
    echo "Skipping database migrations (DATABASE_URL not set)"
fi

echo "Deployment preparation complete!"
echo "The application can now be started with: npm start"
echo ""
echo "Health check endpoint: http://localhost:${PORT:-5000}/api/health"
echo ""
echo "Required environment variables for production:"
echo "  - DATABASE_URL: PostgreSQL connection string"
echo "  - SESSION_SECRET: Secret key for session encryption"
echo "  - PORT: Port number (default: 5000)"
echo ""
echo "Optional environment variables:"
echo "  - WEATHERFLOW_API_TOKEN: WeatherFlow API token"
echo "  - ECOBEE_API_KEY: Ecobee thermostat API key"
echo "  - NODE_ENV: Environment (production/development)"