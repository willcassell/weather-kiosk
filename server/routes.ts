import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWeatherDataSchema, insertThermostatDataSchema, type WeatherFlowStation, type WeatherFlowObservation, type WeatherFlowForecast, type ThermostatData } from "@shared/schema";
import { EcobeeAPI, convertEcobeeToThermostatData } from "./ecobee-api";
import { z } from "zod";

const WEATHERFLOW_API_BASE = "https://swd.weatherflow.com/swd/rest";
const STATION_ID = "38335";

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
    // Fetch current conditions and forecast
    const forecastResponse = await fetch(
      `${WEATHERFLOW_API_BASE}/better_forecast?station_id=${STATION_ID}&token=${token}`
    );

    if (!forecastResponse.ok) {
      throw new Error(`WeatherFlow API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
    }

    const forecastData: WeatherFlowForecast = await forecastResponse.json();
    
    // Get historical data for pressure trend calculation
    const historicalData = await storage.getWeatherHistory(STATION_ID, 6);
    
    const currentConditions = forecastData.current_conditions;
    const todayForecast = forecastData.forecast?.daily[0];
    const yesterdayForecast = forecastData.forecast?.daily[1];

    // Get station name
    const stationName = await fetchStationInfo();

    // Convert WeatherFlow data to our format (with proper unit conversions)
    const weatherData = {
      stationId: STATION_ID,
      stationName: stationName,
      temperature: celsiusToFahrenheit(currentConditions.air_temperature),
      feelsLike: celsiusToFahrenheit(currentConditions.feels_like),
      temperatureHigh: celsiusToFahrenheit(todayForecast?.air_temp_high || currentConditions.air_temperature),
      temperatureLow: celsiusToFahrenheit(todayForecast?.air_temp_low || currentConditions.air_temperature),
      windSpeed: currentConditions.wind_avg * 2.237, // Convert m/s to mph
      windGust: currentConditions.wind_gust * 2.237, // Convert m/s to mph
      windDirection: currentConditions.wind_direction,
      windDirectionCardinal: degreesToCardinal(currentConditions.wind_direction),
      pressure: millibarsToInchesHg(currentConditions.sea_level_pressure),
      pressureTrend: currentConditions.pressure_trend || determinePressureTrend(millibarsToInchesHg(currentConditions.sea_level_pressure), historicalData),
      humidity: currentConditions.relative_humidity,
      uvIndex: currentConditions.uv,
      visibility: 10.0, // WeatherFlow doesn't provide visibility, using default
      dewPoint: celsiusToFahrenheit(currentConditions.dew_point),
      rainToday: 0.0, // Would need additional API call for precipitation data
      rainYesterday: 0.0, // Would need historical precipitation data
    };

    return weatherData;
  } catch (error) {
    console.error("Error fetching WeatherFlow data:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current weather data
  app.get("/api/weather/current", async (req, res) => {
    try {
      const currentData = await storage.getLatestWeatherData(STATION_ID);
      
      // If no data or data is older than 10 minutes, fetch fresh data
      const shouldRefresh = !currentData || 
        (currentData.lastUpdated && Date.now() - currentData.lastUpdated.getTime() > 10 * 60 * 1000);
      
      if (shouldRefresh) {
        console.log("Fetching fresh weather data from WeatherFlow API...");
        const freshData = await fetchWeatherFlowData();
        const savedData = await storage.saveWeatherData(freshData);
        res.json(savedData);
      } else {
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
      // Always use HomeKit simulation for now since Ecobee suspended new developer registrations
      console.log("Using HomeKit simulation for thermostat data");
      
      const { HomeKitDiscovery } = await import('./homekit-discovery.js');
      const discovery = new HomeKitDiscovery();
      const thermostatData = discovery.generateRealisticThermostatData();
      
      // Convert to our expected format
      const formattedData = thermostatData.map((t, index) => ({
        id: index + 1,
        thermostatId: t.id,
        name: t.name,
        temperature: t.temperature,
        targetTemp: t.targetTemp,
        humidity: t.humidity,
        mode: t.mode,
        timestamp: t.timestamp,
        lastUpdated: t.timestamp
      }));
      
      return res.json(formattedData);
      
      // TODO: Uncomment below when you have working Ecobee API or real HomeKit integration
      /*
      const apiKey = getEcobeeApiKey();
      
      if (!apiKey) {
        // Fallback to HomeKit simulation
        return res.json(formattedData);
      }

      const ecobeeApi = new EcobeeAPI(apiKey);
      
      try {
        const thermostatList = await ecobeeApi.getThermostats();
        const convertedData = thermostatList.map((thermostat, index) => 
          convertEcobeeToThermostatData(thermostat, index)
        );
        
        if (convertedData.length === 0) {
          console.warn("No thermostats found in Ecobee account");
          return res.json(formattedData); // Fallback to HomeKit
        }

        res.json(convertedData);
      } catch (authError) {
        console.error("Ecobee authentication error:", authError);
        // Fallback to HomeKit simulation
        return res.json(formattedData);
      }
      */
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
