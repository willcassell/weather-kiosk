import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeatherDataSchema, insertWeatherObservationSchema, insertThermostatDataSchema, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast, type ThermostatData, type WeatherData } from "@shared/schema";
import { EcobeeAPI, convertEcobeeToThermostatData } from "./ecobee-api";

import { fetchBeestatThermostats } from './beestat-api';
import { z } from "zod";

// Import cache for data optimization
let dataCache: any = null;

// Dynamic import to avoid circular dependency
async function initializeCache() {
  if (!dataCache) {
    const { dataCache: cache } = await import('./index.js');
    dataCache = cache;
  }
  return dataCache;
}

// SECURITY: Sanitize URLs containing API keys/tokens for safe logging
function sanitizeUrl(url: string): string {
  return url
    .replace(/([?&])(token|api_key|access_token|key)=([^&]+)/gi, '$1$2=***REDACTED***')
    .replace(/([?&])(password|secret|auth)=([^&]+)/gi, '$1$2=***REDACTED***');
}

const WEATHERFLOW_API_BASE = "https://swd.weatherflow.com/swd/rest";
const STATION_ID = process.env.WEATHERFLOW_STATION_ID || "38335";

// Get API token from environment variables
const getApiToken = () => {
  return process.env.WEATHERFLOW_API_TOKEN || 
         process.env.TEMPEST_API_TOKEN || 
         process.env.API_TOKEN ||
         process.env.WEATHERFLOW_ACCESS_TOKEN;
};

// Get Ecobee API key
const getEcobeeApiKey = () => {
  return process.env.ECOBEE_API_KEY;
};

// Helper function to convert wind direction degrees to cardinal direction
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Helper function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

// Helper function to convert millibars to inches of mercury
function millibarsToInchesHg(millibars: number): number {
  return millibars * 0.02953;
}

// Helper function to convert millimeters to inches
function millimetersToInches(millimeters: number): number {
  return millimeters * 0.0393701;
}



// Helper function to determine pressure trend
function determinePressureTrend(currentPressure: number, historicalData: any[]): string {
  if (historicalData.length < 2) return "Steady";
  
  const previousPressure = historicalData[historicalData.length - 2]?.pressure;
  if (!previousPressure) return "Steady";
  
  const diff = currentPressure - previousPressure;
  if (diff > 0.03) return "Rising";
  if (diff < -0.03) return "Falling";
  return "Steady";
}

// Helper function to fetch station info from WeatherFlow API
async function fetchStationInfo(): Promise<string> {
  const token = getApiToken();
  if (!token) return "Corner Rock Wx";

  try {
    const response = await fetch(`${WEATHERFLOW_API_BASE}/stations/${STATION_ID}?token=${token}`);
    
    if (!response.ok) {
      console.warn(`WeatherFlow station API error: ${response.status}, using fallback name`);
      return "Corner Rock Wx";
    }
    
    const stationData: WeatherFlowStation = await response.json();
    return stationData.name || "Corner Rock Wx";
  } catch (error) {
    console.warn("Error fetching station info, using fallback name:", error);
    return "Corner Rock Wx";
  }
}

async function fetchWeatherFlowData(): Promise<any> {
  const token = getApiToken();
  if (!token) {
    throw new Error("WeatherFlow API token not found in environment variables");
  }

  try {
    // Fetch both recent observations and forecast for most current data
    const [observationsResponse, forecastResponse] = await Promise.all([
      fetch(`${WEATHERFLOW_API_BASE}/observations/station/${STATION_ID}?token=${token}`),
      fetch(`${WEATHERFLOW_API_BASE}/better_forecast?station_id=${STATION_ID}&token=${token}`)
    ]);

    if (!forecastResponse.ok) {
      throw new Error(`WeatherFlow forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
    }

    const forecastData: WeatherFlowForecast = await forecastResponse.json();
    
    // Get precipitation data from forecast if available
    const apiRainToday = forecastData.current_conditions ? millimetersToInches((forecastData.current_conditions as any).precip_accum_local_day || 0) : 0;
    const apiRainYesterday = forecastData.current_conditions ? millimetersToInches((forecastData.current_conditions as any).precip_accum_local_yesterday || 0) : 0;
    
    console.log(`API Precipitation: Today ${apiRainToday.toFixed(2)}", Yesterday ${apiRainYesterday.toFixed(2)}" (from WeatherFlow processed data)`);
    
    // Use most recent observation if available, otherwise fall back to forecast current conditions
    let currentConditions = forecastData.current_conditions as any;
    let latestObs = null;
    
    if (observationsResponse.ok) {
      const observationsData = await observationsResponse.json();
      if (observationsData.obs && observationsData.obs.length > 0) {
        // Use the most recent observation for temperature
        latestObs = observationsData.obs[0];
        console.log(`Using latest observation data (timestamp: ${new Date(latestObs.timestamp * 1000).toISOString()})`);
        console.log(`Lightning data: strikes=${latestObs.lightning_strike_count}, avg_distance=${latestObs.lightning_strike_avg_distance}`);
        
        // Store this observation in our database
        try {
          await storage.saveWeatherObservation({
            stationId: STATION_ID,
            timestamp: new Date(latestObs.timestamp * 1000),
            temperature: celsiusToFahrenheit(latestObs.air_temperature),
            feelsLike: latestObs.feels_like ? celsiusToFahrenheit(latestObs.feels_like) : null,
            windSpeed: latestObs.wind_avg ? latestObs.wind_avg * 2.237 : null, // Convert m/s to mph
            windGust: latestObs.wind_gust ? latestObs.wind_gust * 2.237 : null,
            windDirection: latestObs.wind_direction || null,
            pressure: latestObs.station_pressure ? millibarsToInchesHg(latestObs.station_pressure) : null,
            humidity: latestObs.relative_humidity || null,
            uvIndex: latestObs.uv || null,
            dewPoint: latestObs.dew_point ? celsiusToFahrenheit(latestObs.dew_point) : null,
            rainAccumulation: latestObs.rain_accumulation ? millimetersToInches(latestObs.rain_accumulation) : null,
            lightningStrikeCount: latestObs.lightning_strike_count || null,
            lightningStrikeDistance: latestObs.lightning_strike_avg_distance ? 
              latestObs.lightning_strike_avg_distance * 0.621371 : null // Convert km to miles
          });
          console.log("Stored weather observation in database");
        } catch (obsError) {
          console.warn("Failed to store weather observation:", obsError);
        }
        
        currentConditions = {
          ...currentConditions,
          air_temperature: latestObs.air_temperature,
          feels_like: latestObs.feels_like,
          wind_avg: latestObs.wind_avg,
          wind_direction: latestObs.wind_direction,
          station_pressure: latestObs.station_pressure,
          relative_humidity: latestObs.relative_humidity,
          uv: latestObs.uv,
          brightness: latestObs.brightness,
          dew_point: latestObs.dew_point,
          lightning_strike_count: latestObs.lightning_strike_count,
          lightning_strike_avg_distance: latestObs.lightning_strike_avg_distance
        };
      }
    } else {
      console.log("Observations API not available, using forecast current conditions");
    }
    

    

    
    // Get historical data for pressure trend calculation
    const historicalData = await storage.getWeatherHistory(STATION_ID, 6);
    
    // Calculate daily high/low from our stored observations (observed data only)
    const rawTempC = currentConditions.air_temperature;
    const currentTemp = Math.round(celsiusToFahrenheit(rawTempC) * 10) / 10; // Round to 1 decimal place
    console.log(`Raw temperature from WeatherFlow: ${rawTempC}°C = ${celsiusToFahrenheit(rawTempC)}°F, rounded to: ${currentTemp}°F`);
    
    const today = new Date();
    const todayExtremes = await storage.getDailyTemperatureExtremes(STATION_ID, today);
    
    let actualHigh = currentTemp;
    let actualLow = currentTemp;
    let highTime = new Date();
    let lowTime = new Date();
    
    if (todayExtremes) {
      // Use database-calculated extremes
      actualHigh = Math.max(todayExtremes.high, currentTemp);
      actualLow = Math.min(todayExtremes.low, currentTemp);
      highTime = todayExtremes.high >= currentTemp ? todayExtremes.highTime : new Date();
      lowTime = todayExtremes.low <= currentTemp ? todayExtremes.lowTime : new Date();
      
      console.log(`Daily temps from observations database: High ${actualHigh.toFixed(1)}°F at ${highTime.toLocaleString()}, Low ${actualLow.toFixed(1)}°F at ${lowTime.toLocaleString()}`);
    } else {
      console.log("No observations found for today, using current temperature as baseline");
    }

    // Get station name
    const stationName = await fetchStationInfo();
    


    // Get recent lightning data from database if available (within last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let lightningStrikeTime = null;
    let lightningStrikeDistance = null;
    
    try {
      const recentLightning = await storage.getRecentLightningData(STATION_ID, thirtyMinutesAgo);
      if (recentLightning) {
        lightningStrikeTime = recentLightning.timestamp;
        lightningStrikeDistance = recentLightning.distance;
        console.log(`Recent lightning detected: ${lightningStrikeDistance} mi at ${lightningStrikeTime.toISOString()}`);
      }
    } catch (error) {
      console.warn("Error fetching recent lightning data:", error);
      // Fallback to current observation data if database query fails
      if (currentConditions.lightning_strike_count > 0 && latestObs) {
        lightningStrikeTime = new Date(latestObs.timestamp * 1000);
        lightningStrikeDistance = currentConditions.lightning_strike_avg_distance ? 
          Math.round(currentConditions.lightning_strike_avg_distance * 0.621371 * 10) / 10 : null;
        console.log(`Using observation lightning data: ${lightningStrikeDistance} mi at ${lightningStrikeTime.toISOString()}`);
      }
    }

    // Convert WeatherFlow data to our format (with proper unit conversions)
    const weatherData = {
      stationId: STATION_ID,
      stationName: stationName,
      temperature: currentTemp,
      feelsLike: celsiusToFahrenheit(currentConditions.feels_like),
      temperatureHigh: actualHigh, // Use actual recorded high temperature
      temperatureLow: actualLow,   // Use actual recorded low temperature
      temperatureHighTime: highTime, // Time when high temp was observed
      temperatureLowTime: lowTime,   // Time when low temp was observed
      windSpeed: currentConditions.wind_avg * 2.237, // Convert m/s to mph
      windGust: currentConditions.wind_gust * 2.237, // Convert m/s to mph
      windDirection: currentConditions.wind_direction,
      windDirectionCardinal: degreesToCardinal(currentConditions.wind_direction),
      pressure: millibarsToInchesHg(currentConditions.sea_level_pressure),
      pressureTrend: currentConditions.pressure_trend || determinePressureTrend(millibarsToInchesHg(currentConditions.sea_level_pressure), historicalData),
      humidity: currentConditions.relative_humidity,
      uvIndex: currentConditions.uv,
      lightningStrikeDistance: lightningStrikeDistance, // Use real lightning data from observations
      lightningStrikeTime: lightningStrikeTime, // Use actual observation timestamp, not current time
      dewPoint: celsiusToFahrenheit(currentConditions.dew_point),
      rainToday: Math.round(millimetersToInches(currentConditions.precip_accum_local_day || 0) * 100) / 100,
      rainYesterday: Math.round(millimetersToInches(currentConditions.precip_accum_local_yesterday || 0) * 100) / 100
    };

    return weatherData;
  } catch (error) {
    console.error("Error fetching WeatherFlow data:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment monitoring
  app.get("/api/health", async (req, res) => {
    try {
      const healthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        database: !!process.env.DATABASE_URL,
        memory: process.memoryUsage(),
        version: process.version,
        port: process.env.PORT || "5000"
      };

      // Test database connection if available
      if (process.env.DATABASE_URL) {
        try {
          const latestData = await storage.getLatestWeatherData("38335");
          healthStatus.database = true;
          (healthStatus as any).lastWeatherUpdate = latestData?.lastUpdated || null;
        } catch (error) {
          healthStatus.database = false;
          (healthStatus as any).databaseError = "Connection failed";
        }
      }

      res.status(200).json(healthStatus);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current weather data with caching
  app.get("/api/weather/current", async (req, res) => {
    try {
      const cache = await initializeCache();
      const forceRefresh = req.query.force === 'true';

      // Check in-memory cache first
      const cacheKey = `weather:${STATION_ID}`;
      let cachedData = cache.get(cacheKey);

      if (cachedData && !forceRefresh) {
        console.log(`Serving cached weather data`);
        return res.json(cachedData);
      }

      const currentData = await storage.getLatestWeatherData(STATION_ID);

      // Fixed 3-minute refresh interval
      const refreshInterval = 3 * 60 * 1000; // 3 minutes
      const shouldRefresh = forceRefresh || !currentData ||
        (currentData.lastUpdated && Date.now() - currentData.lastUpdated.getTime() > refreshInterval);

      if (shouldRefresh) {
        const reason = forceRefresh ? "Force refresh requested" : "Scheduled refresh";
        console.log(`${reason} - Fetching fresh weather data from WeatherFlow API...`);

        const freshData = await fetchWeatherFlowData();
        const savedData = await storage.saveWeatherData(freshData);

        // Cache the fresh data for 2 minutes
        cache.set(cacheKey, savedData, 2);

        res.json(savedData);
      } else {
        // Cache the database data for 2 minutes
        cache.set(cacheKey, currentData, 2);
        console.log(`Using stored data from ${currentData.lastUpdated}`);
        res.json(currentData);
      }
    } catch (error) {
      console.error("Error getting current weather:", error);

      // Fallback to cache
      try {
        const cache = await initializeCache();
        const cacheKey = `weather:${STATION_ID}`;
        const fallbackCached = cache.get(cacheKey);
        if (fallbackCached) {
          return res.json({ ...fallbackCached, stale: true, cached: true });
        }
      } catch (cacheError) {
        console.error("Cache fallback failed:", cacheError);
      }

      res.status(500).json({
        error: "Failed to fetch weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Force refresh weather data
  app.post("/api/weather/refresh", async (req, res) => {
    try {
      console.log("Force refreshing weather data...");
      const freshData = await fetchWeatherFlowData();
      const savedData = await storage.saveWeatherData(freshData);
      res.json(savedData);
    } catch (error) {
      console.error("Error refreshing weather data:", error);
      res.status(500).json({ 
        error: "Failed to refresh weather data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get weather history
  app.get("/api/weather/history/:hours", async (req, res) => {
    try {
      const hours = parseInt(req.params.hours) || 24;
      const history = await storage.getWeatherHistory(STATION_ID, hours);
      res.json(history);
    } catch (error) {
      console.error("Error getting weather history:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather history",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Thermostat API endpoints
  app.get("/api/thermostats/current", async (req, res) => {
    try {
      const cache = await initializeCache();
      const forceRefresh = req.query.force === 'true';

      // Check cache first
      const cacheKey = `thermostats:current`;
      let cachedData = cache.get(cacheKey);

      // Only use cache if it's less than 1 minute old and not a force refresh
      if (cachedData && !forceRefresh) {
        const dataAge = Date.now() - cachedData.timestamp;
        const maxCacheAge = 1 * 60 * 1000; // 1 minute for faster updates

        if (dataAge < maxCacheAge) {
          console.log(`Serving cached thermostat data (${Math.floor(dataAge / 1000)}s old)`);
          return res.json({
            thermostats: cachedData.data,
            cached: true,
            stale: false,
            lastUpdated: new Date(cachedData.timestamp).toISOString()
          });
        } else {
          console.log(`Cache expired (${Math.floor(dataAge / 1000)}s old), fetching fresh data`);
          // Cache expired, fall through to fetch fresh data
        }
      }

      if (process.env.BEESTAT_API_KEY) {
        try {
          console.log(`Fetching fresh thermostat data from Beestat API`);
          const thermostatData = await fetchBeestatThermostats();

          // Save thermostat data to database for historical tracking
          for (const thermostat of thermostatData) {
            try {
              await storage.saveThermostatData({
                thermostatId: thermostat.id.toString(),
                name: thermostat.name,
                temperature: thermostat.temperature,
                targetTemp: thermostat.targetTemp,
                humidity: thermostat.humidity || null,
                mode: thermostat.mode,
                hvacState: thermostat.hvacState || 'unknown'
              });
              console.log(`✓ Saved thermostat data to database: ${thermostat.name} (${thermostat.temperature}°F)`);
            } catch (saveError) {
              console.error(`✗ Failed to save thermostat data for ${thermostat.name}:`, saveError);
            }
          }

          // Cache with timestamp for 1 minute (60 seconds)
          // Short cache to quickly pick up changes from Beestat API
          cache.set(cacheKey, {
            data: thermostatData,
            timestamp: Date.now()
          }, 1);

          // No browser caching - always fetch fresh
          res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Expires': '0',
            'Pragma': 'no-cache'
          });

          return res.json({
            thermostats: thermostatData,
            cached: false,
            stale: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (beestatError) {
          console.error("Beestat API failed:", beestatError);

          // Fallback to cache if available
          const fallbackCached = cache.get(cacheKey);
          if (fallbackCached) {
            const dataAge = Date.now() - fallbackCached.timestamp;
            console.log(`Using stale cached thermostat data (${Math.floor(dataAge / 1000 / 60)} minutes old)`);

            return res.json({
              thermostats: fallbackCached.data,
              cached: true,
              stale: true,
              lastUpdated: new Date(fallbackCached.timestamp).toISOString(),
              error: "Failed to fetch fresh data, using cached version"
            });
          }
        }
      } else {
        console.log("BEESTAT_API_KEY not found, no thermostat data available");
      }

      // No thermostat data available
      console.log("No thermostat data available - Beestat API key required");
      return res.json({
        thermostats: [],
        cached: false,
        stale: false
      });

    } catch (error) {
      console.error("Error getting thermostat data:", error);
      res.status(500).json({
        error: "Failed to fetch thermostat data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manual thermostat refresh endpoint to bypass cache
  app.post("/api/thermostats/refresh", async (req, res) => {
    console.log("POST /api/thermostats/refresh - forcing fresh data");
    try {
      if (!process.env.BEESTAT_API_KEY) {
        return res.status(400).json({ error: "BEESTAT_API_KEY not configured" });
      }

      console.log("Force refreshing thermostat data from Beestat API");
      const thermostatData = await fetchBeestatThermostats();
      
      // Clear cache and set fresh data
      await initializeCache();
      const cacheKey = `thermostats:current`;
      dataCache.set(cacheKey, thermostatData, 2); // Short cache after manual refresh
      
      res.json({ success: true, message: "Thermostat data refreshed", thermostats: thermostatData });
    } catch (error) {
      console.error("Error refreshing thermostat data:", error);
      res.status(500).json({ 
        error: "Failed to refresh thermostat data",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Ecobee authentication endpoints
  app.post("/api/thermostats/auth/start", async (req, res) => {
    try {
      const apiKey = getEcobeeApiKey();
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: "No Ecobee API key configured",
          message: "Please add ECOBEE_API_KEY to environment variables"
        });
      }

      const ecobeeApi = new EcobeeAPI(apiKey);
      const authData = await ecobeeApi.initiateAuth();
      
      res.json({
        message: "Please go to ecobee.com, log in, and enter this PIN in My Apps section",
        pin: authData.pin,
        authorizationCode: authData.authorizationCode,
        expiresIn: authData.expiresIn,
        instructions: [
          "1. Go to ecobee.com and log in",
          "2. Click 'My Apps' in the menu",
          "3. Click 'Add Application'", 
          "4. Enter PIN: " + authData.pin,
          "5. Click 'Authorize'",
          "6. Then call POST /api/thermostats/auth/complete with the authorizationCode"
        ]
      });
    } catch (error) {
      console.error("Error starting Ecobee auth:", error);
      res.status(500).json({ 
        error: "Failed to start authentication",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/thermostats/auth/complete", async (req, res) => {
    try {
      const { authorizationCode } = req.body;
      
      if (!authorizationCode) {
        return res.status(400).json({ 
          error: "Authorization code required",
          message: "Please provide the authorizationCode from the auth/start response"
        });
      }

      const apiKey = getEcobeeApiKey();
      if (!apiKey) {
        return res.status(400).json({ 
          error: "No Ecobee API key configured"
        });
      }

      const ecobeeApi = new EcobeeAPI(apiKey);
      const tokens = await ecobeeApi.completeAuth(authorizationCode);
      
      res.json({
        message: "Authentication successful! You can now fetch thermostat data.",
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type
      });
    } catch (error) {
      console.error("Error completing Ecobee auth:", error);
      res.status(500).json({ 
        error: "Failed to complete authentication",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/thermostats/auth/status", async (req, res) => {
    try {
      const apiKey = getEcobeeApiKey();
      
      if (!apiKey) {
        return res.json({ 
          hasApiKey: false,
          message: "No Ecobee API key configured"
        });
      }

      const ecobeeApi = new EcobeeAPI(apiKey);
      const status = ecobeeApi.getTokenStatus();
      
      res.json({
        hasApiKey: true,
        ...status,
        message: status.hasTokens 
          ? status.isExpired 
            ? "Authentication expired. Tokens need refresh."
            : "Authentication active"
          : "No authentication tokens. Please authenticate first."
      });
    } catch (error) {
      console.error("Error checking auth status:", error);
      res.status(500).json({ 
        error: "Failed to check authentication status",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Note: No background polling needed for thermostat data - using on-demand API calls with caching

  const httpServer = createServer(app);
  return httpServer;
}
