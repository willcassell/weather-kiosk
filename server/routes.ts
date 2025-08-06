import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeatherDataSchema, insertThermostatDataSchema, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast, type ThermostatData, type WeatherData } from "@shared/schema";
import { EcobeeAPI, convertEcobeeToThermostatData } from "./ecobee-api";

import { fetchBeestatThermostats } from './beestat-api';
import { z } from "zod";

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
    
    // Use most recent observation if available, otherwise fall back to forecast current conditions
    let currentConditions = forecastData.current_conditions as any;
    
    if (observationsResponse.ok) {
      const observationsData = await observationsResponse.json();
      if (observationsData.obs && observationsData.obs.length > 0) {
        // Use the most recent observation for temperature
        const latestObs = observationsData.obs[0];
        console.log(`Using latest observation data (timestamp: ${new Date(latestObs.timestamp * 1000).toISOString()})`);
        console.log(`Lightning data: strikes=${latestObs.lightning_strike_count}, avg_distance=${latestObs.lightning_strike_avg_distance}`);
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
    
    // Get today's recorded data for actual high/low calculations (only from today, not past 24 hours)
    // Use local timezone for proper midnight calculation
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Set to midnight in local timezone
    const todayHistory = await storage.getWeatherHistorySince(STATION_ID, todayStart);
    
    const todayForecast = forecastData.forecast?.daily[0];
    const yesterdayForecast = forecastData.forecast?.daily[1];

    // Calculate actual daily high and low from recorded station data with timestamps (only from today)
    const rawTempC = currentConditions.air_temperature;
    const currentTemp = Math.round(celsiusToFahrenheit(rawTempC) * 10) / 10; // Round to 1 decimal place
    console.log(`Raw temperature from WeatherFlow: ${rawTempC}°C = ${celsiusToFahrenheit(rawTempC)}°F, rounded to: ${currentTemp}°F`);
    const currentTime = new Date();
    let actualHigh = currentTemp;
    let actualLow = currentTemp;
    let highTime = currentTime;
    let lowTime = currentTime;
    
    if (todayHistory && todayHistory.length > 0) {
      // Filter records to only include those from today (since midnight)
      const todayValidRecords = todayHistory.filter((record: WeatherData) => {
        if (!record.temperature || !record.timestamp) return false;
        const recordDate = new Date(record.timestamp);
        const recordDateLocal = new Date(recordDate.getTime() - recordDate.getTimezoneOffset() * 60000);
        return recordDateLocal >= todayStart; // Only records from today in local timezone
      });
      
      if (todayValidRecords.length > 0) {
        // Add current reading to the mix
        const allReadings = [...todayValidRecords, { temperature: currentTemp, timestamp: currentTime }];
        
        // Find high and low with their times
        const highRecord = allReadings.reduce((max, record) => 
          (record.temperature ?? 0) > (max.temperature ?? 0) ? record : max
        );
        const lowRecord = allReadings.reduce((min, record) => 
          (record.temperature ?? 0) < (min.temperature ?? 0) ? record : min
        );
        
        actualHigh = highRecord.temperature ?? currentTemp;
        actualLow = lowRecord.temperature ?? currentTemp;
        highTime = highRecord.timestamp;
        lowTime = lowRecord.timestamp;
        
        console.log(`Calculated daily temps from ${allReadings.length} readings since midnight: High ${actualHigh.toFixed(1)}°F at ${new Date(highTime).toLocaleTimeString()}, Low ${actualLow.toFixed(1)}°F at ${new Date(lowTime).toLocaleTimeString()}`);
      } else {
        console.log("No temperature data recorded since midnight, using current temperature for high/low");
      }
    } else {
      console.log("No historical data available since midnight, using current temperature for high/low");
    }

    // Get station name
    const stationName = await fetchStationInfo();
    


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
      lightningStrikeDistance: currentConditions.lightning_strike_avg_distance ? 
        Math.round(currentConditions.lightning_strike_avg_distance * 0.621371 * 10) / 10 : null, // Convert km to miles with 1 decimal
      lightningStrikeTime: currentConditions.lightning_strike_count > 0 ? new Date() : null, // Use current time if strikes detected
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

  // Get current weather data
  app.get("/api/weather/current", async (req, res) => {
    try {
      const currentData = await storage.getLatestWeatherData(STATION_ID);
      
      // If no data or data is older than 3 minutes, fetch fresh data
      // Allow force refresh with query parameter
      const forceRefresh = req.query.force === 'true';
      const shouldRefresh = forceRefresh || !currentData || 
        (currentData.lastUpdated && Date.now() - currentData.lastUpdated.getTime() > 3 * 60 * 1000);
      
      if (shouldRefresh) {
        const reason = forceRefresh ? "Force refresh requested" : "Data is stale";
        console.log(`${reason} - Fetching fresh weather data from WeatherFlow API...`);
        const freshData = await fetchWeatherFlowData();
        const savedData = await storage.saveWeatherData(freshData);
        
        // Also refresh thermostat data when weather data is refreshed
        try {
          if (process.env.BEESTAT_API_KEY) {
            console.log("Refreshing thermostat data from Beestat API");
            await fetchBeestatThermostats();
          }
        } catch (thermostatError) {
          console.warn("Failed to refresh thermostat data:", thermostatError);
        }
        
        res.json(savedData);
      } else {
        console.log(`Using cached data from ${currentData.lastUpdated}`);
        res.json(currentData);
      }
    } catch (error) {
      console.error("Error getting current weather:", error);
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
      // Check for cached thermostat data
      const currentThermostatData = await storage.getLatestThermostatData();
      
      // Allow force refresh with query parameter
      const forceRefresh = req.query.force === 'true';
      const shouldRefresh = forceRefresh || !currentThermostatData || currentThermostatData.length === 0 ||
        (currentThermostatData.length > 0 && currentThermostatData[0].lastUpdated && 
         Date.now() - currentThermostatData[0].lastUpdated.getTime() > 3 * 60 * 1000);
      
      // Try Beestat API first  
      if (process.env.BEESTAT_API_KEY) {
        if (shouldRefresh) {
          try {
            const reason = forceRefresh ? "Force refresh requested" : "Thermostat data is stale";
            console.log(`${reason} - Fetching thermostat data from Beestat API`);
            const thermostatData = await fetchBeestatThermostats();
            
            // Save to storage for caching
            for (const thermostat of thermostatData) {
              await storage.saveThermostatData({
                thermostatId: thermostat.thermostatId,
                name: thermostat.name,
                temperature: thermostat.temperature,
                targetTemp: thermostat.targetTemp,
                humidity: thermostat.humidity,
                mode: thermostat.mode
              });
            }
            
            return res.json(thermostatData);
          } catch (beestatError) {
            console.error("Beestat API failed, falling back to cached data:", beestatError);
            // If we have cached data, use it
            if (currentThermostatData && currentThermostatData.length > 0) {
              console.log("Using cached thermostat data due to API failure");
              return res.json(currentThermostatData);
            }
          }
        } else {
          console.log(`Using cached thermostat data from ${currentThermostatData?.[0]?.lastUpdated}`);
          return res.json(currentThermostatData || []);
        }
      } else {
        console.log("BEESTAT_API_KEY not found, no thermostat data available");
      }
      
      // No thermostat data available
      console.log("No thermostat data available - Beestat API key required");
      return res.json([]);
      

    } catch (error) {
      console.error("Error getting thermostat data:", error);
      res.status(500).json({ 
        error: "Failed to fetch thermostat data",
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

  const httpServer = createServer(app);
  return httpServer;
}
