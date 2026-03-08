import { Router } from "express";
import { storage } from "../storage";
import { metrics } from "../metrics.js";
import {
    WeatherFlowStationSchema,
    WeatherFlowForecastSchema,
    WeatherFlowObservationSchema,
    validateWeatherDataQuality,
    type WeatherFlowForecast,
    type WeatherFlowObservation
} from '../api-validation';
import { z, ZodError } from "zod";

export const weatherRouter = Router();

const WEATHERFLOW_API_BASE = "https://swd.weatherflow.com/swd/rest";
const STATION_ID = process.env.WEATHERFLOW_STATION_ID || "38335";

// Get API token from environment variables
const getApiToken = () => {
    return process.env.WEATHERFLOW_API_TOKEN ||
        process.env.TEMPEST_API_TOKEN ||
        process.env.API_TOKEN ||
        process.env.WEATHERFLOW_ACCESS_TOKEN;
};

// --- Helper Functions ---

function degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9 / 5) + 32;
}

function millibarsToInchesHg(millibars: number): number {
    return millibars * 0.02953;
}

function millimetersToInches(millimeters: number): number {
    return millimeters * 0.0393701;
}

function determinePressureTrend(currentPressure: number, historicalData: any[]): string {
    if (historicalData.length < 2) return "Steady";

    const previousPressure = historicalData[historicalData.length - 2]?.pressure;
    if (!previousPressure) return "Steady";

    const diff = currentPressure - previousPressure;
    if (diff > 0.03) return "Rising";
    if (diff < -0.03) return "Falling";
    return "Steady";
}

async function fetchStationInfo(): Promise<string> {
    const token = getApiToken();
    if (!token) return "Corner Rock Wx";

    try {
        const response = await fetch(`${WEATHERFLOW_API_BASE}/stations/${STATION_ID}?token=${token}`);

        if (!response.ok) {
            console.warn(`WeatherFlow station API error: ${response.status}, using fallback name`);
            return "Corner Rock Wx";
        }

        const rawData = await response.json();

        try {
            const stationData = WeatherFlowStationSchema.parse(rawData);
            return stationData.name || "Corner Rock Wx";
        } catch (error) {
            if (error instanceof ZodError) {
                console.warn(`WeatherFlow station data validation failed, using fallback:`, error.errors);
            }
            return "Corner Rock Wx";
        }
    } catch (error) {
        console.warn("Error fetching station info, using fallback name:", error);
        return "Corner Rock Wx";
    }
}

export async function fetchWeatherFlowData(): Promise<any> {
    const token = getApiToken();
    if (!token) {
        throw new Error("WeatherFlow API token not found in environment variables");
    }

    const startTime = Date.now();
    try {
        const [observationsResponse, forecastResponse] = await Promise.all([
            fetch(`${WEATHERFLOW_API_BASE}/observations/station/${STATION_ID}?token=${token}`),
            fetch(`${WEATHERFLOW_API_BASE}/better_forecast?station_id=${STATION_ID}&token=${token}`)
        ]);

        if (!forecastResponse.ok) {
            throw new Error(`WeatherFlow forecast API error: ${forecastResponse.status} ${forecastResponse.statusText}`);
        }

        const rawForecastData = await forecastResponse.json();

        let forecastData: WeatherFlowForecast;
        try {
            forecastData = WeatherFlowForecastSchema.parse(rawForecastData);
        } catch (error) {
            if (error instanceof ZodError) {
                console.error(`WeatherFlow forecast data validation failed:`, error.errors);
                throw new Error(`WeatherFlow forecast API returned invalid data: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw error;
        }

        const apiRainToday = forecastData.current_conditions ? millimetersToInches((forecastData.current_conditions as any).precip_accum_local_day || 0) : 0;
        const apiRainYesterday = forecastData.current_conditions ? millimetersToInches((forecastData.current_conditions as any).precip_accum_local_yesterday || 0) : 0;

        let currentConditions = forecastData.current_conditions as any;
        let latestObs = null;

        if (observationsResponse.ok) {
            const rawObservationsData = await observationsResponse.json();

            let observationsData: WeatherFlowObservation | null = null;
            try {
                observationsData = WeatherFlowObservationSchema.parse(rawObservationsData);
            } catch (error) {
                if (error instanceof ZodError) {
                    console.warn(`WeatherFlow observations data validation failed, using forecast data:`, error.errors);
                    console.warn(`Raw Observation Payload causing failure:`, JSON.stringify(rawObservationsData, null, 2));
                    observationsData = null;
                }
            }

            if (observationsData && observationsData.obs && observationsData.obs.length > 0) {
                latestObs = observationsData.obs[0];

                try {
                    const temperature = celsiusToFahrenheit(latestObs.air_temperature);
                    const windSpeed = latestObs.wind_avg ? latestObs.wind_avg * 2.237 : null;
                    const pressure = latestObs.station_pressure ? millibarsToInchesHg(latestObs.station_pressure) : null;
                    const humidity = latestObs.relative_humidity || null;

                    const qualityWarnings = validateWeatherDataQuality({
                        temperature,
                        windSpeed,
                        pressure,
                        humidity,
                    });

                    if (qualityWarnings.length > 0) {
                        console.warn('⚠️  Data quality warnings detected:');
                        qualityWarnings.forEach(warning => console.warn(`  - ${warning}`));
                    }

                    await storage.saveWeatherObservation({
                        stationId: STATION_ID,
                        timestamp: new Date(latestObs.timestamp * 1000),
                        temperature,
                        feelsLike: latestObs.feels_like ? celsiusToFahrenheit(latestObs.feels_like) : null,
                        windSpeed,
                        windGust: latestObs.wind_gust ? latestObs.wind_gust * 2.237 : null,
                        windDirection: latestObs.wind_direction || null,
                        pressure,
                        humidity,
                        uvIndex: latestObs.uv || null,
                        dewPoint: latestObs.dew_point ? celsiusToFahrenheit(latestObs.dew_point) : null,
                        rainAccumulation: latestObs.rain_accumulation ? millimetersToInches(latestObs.rain_accumulation) : null,
                        lightningStrikeCount: latestObs.lightning_strike_count || null,
                        lightningStrikeDistance: latestObs.lightning_strike_avg_distance ?
                            latestObs.lightning_strike_avg_distance * 0.621371 : null
                    });
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
        }

        const historicalData = await storage.getWeatherHistory(STATION_ID, 6);
        const rawTempC = currentConditions.air_temperature;
        const currentTemp = Math.round(celsiusToFahrenheit(rawTempC) * 10) / 10;

        const today = new Date();
        const todayExtremes = await storage.getDailyTemperatureExtremes(STATION_ID, today);

        let actualHigh = currentTemp;
        let actualLow = currentTemp;
        let highTime = new Date();
        let lowTime = new Date();

        if (todayExtremes) {
            actualHigh = Math.max(todayExtremes.high, currentTemp);
            actualLow = Math.min(todayExtremes.low, currentTemp);
            highTime = todayExtremes.high >= currentTemp ? todayExtremes.highTime : new Date();
            lowTime = todayExtremes.low <= currentTemp ? todayExtremes.lowTime : new Date();
        }

        const stationName = await fetchStationInfo();

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        let lightningStrikeTime = null;
        let lightningStrikeDistance = null;

        try {
            const recentLightning = await storage.getRecentLightningData(STATION_ID, thirtyMinutesAgo);
            if (recentLightning) {
                lightningStrikeTime = recentLightning.timestamp;
                lightningStrikeDistance = recentLightning.distance;
            }
        } catch (error) {
            if (currentConditions.lightning_strike_count > 0 && latestObs) {
                lightningStrikeTime = new Date(latestObs.timestamp * 1000);
                lightningStrikeDistance = currentConditions.lightning_strike_avg_distance ?
                    Math.round(currentConditions.lightning_strike_avg_distance * 0.621371 * 10) / 10 : null;
            }
        }

        const weatherData = {
            stationId: STATION_ID,
            stationName: stationName,
            temperature: currentTemp,
            feelsLike: celsiusToFahrenheit(currentConditions.feels_like),
            temperatureHigh: actualHigh,
            temperatureLow: actualLow,
            temperatureHighTime: highTime,
            temperatureLowTime: lowTime,
            windSpeed: currentConditions.wind_avg * 2.237,
            windGust: currentConditions.wind_gust * 2.237,
            windDirection: currentConditions.wind_direction,
            windDirectionCardinal: degreesToCardinal(currentConditions.wind_direction),
            pressure: millibarsToInchesHg(currentConditions.sea_level_pressure),
            pressureTrend: currentConditions.pressure_trend || determinePressureTrend(millibarsToInchesHg(currentConditions.sea_level_pressure), historicalData),
            humidity: currentConditions.relative_humidity,
            uvIndex: currentConditions.uv,
            lightningStrikeDistance: lightningStrikeDistance,
            lightningStrikeTime: lightningStrikeTime,
            dewPoint: celsiusToFahrenheit(currentConditions.dew_point),
            rainToday: Math.round(apiRainToday * 100) / 100,
            rainYesterday: Math.round(apiRainYesterday * 100) / 100
        };

        metrics.recordApiCall({ service: 'weatherflow_fetch', success: true, durationMs: Date.now() - startTime });
        return weatherData;
    } catch (error) {
        metrics.recordApiCall({ service: 'weatherflow_fetch', success: false, durationMs: Date.now() - startTime, error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

// --- Routes ---

import { dataCache } from '../cache.js';

async function initializeCache() {
    return dataCache;
}

weatherRouter.get("/current", async (req, res) => {
    try {
        const cache = await initializeCache();
        const forceRefresh = req.query.force === 'true';

        const cacheKey = `weather:${STATION_ID}`;
        let cachedData = cache.get(cacheKey) as any;
        const currentData = await storage.getLatestWeatherData(STATION_ID);

        // If the DB has strictly newer data than the memory cache, invalidate the memory cache immediately
        if (cachedData && currentData && currentData.lastUpdated > cachedData.lastUpdated) {
            console.log(`[WEATHER API] Invalidating local cache due to newer DB insert.`);
            cache.set(cacheKey, null, -1);
            cachedData = null;
        }

        if (cachedData && !forceRefresh) {
            return res.json(cachedData);
        }
        const refreshInterval = 3 * 60 * 1000;
        const timeSinceUpdate = currentData?.lastUpdated ? Date.now() - currentData.lastUpdated.getTime() : Infinity;
        const shouldRefresh = forceRefresh || !currentData || timeSinceUpdate > refreshInterval;

        console.log(`[WEATHER API] forceRefresh: ${forceRefresh}, timeSinceUpdateMs: ${timeSinceUpdate}, shouldRefresh: ${shouldRefresh}`);

        if (shouldRefresh) {
            if (currentData) {
                // Return existing data immediately; refresh in background
                cache.set(cacheKey, currentData, 2);
                res.json(currentData);

                // Fire-and-forget refresh
                fetchWeatherFlowData()
                    .then(fresh => storage.saveWeatherData(fresh))
                    .then(saved => cache.set(cacheKey, saved, 2))
                    .catch(err => console.error("[WEATHER API] Background refresh failed:", err));
            } else {
                // No existing data at all — must wait for API (cold start)
                const freshData = await fetchWeatherFlowData();
                const savedData = await storage.saveWeatherData(freshData);
                cache.set(cacheKey, savedData, 2);
                res.json(savedData);
            }
        } else {
            cache.set(cacheKey, currentData, 2);
            res.json(currentData);
        }
    } catch (error) {
        console.error("Error getting current weather:", error);

        try {
            const cache = await initializeCache();
            const fallbackCached = cache.get(`weather:${STATION_ID}`);
            if (fallbackCached) {
                return res.json({ ...fallbackCached, stale: true, cached: true });
            }

            // Try DB as secondary fallback
            const dbFallback = await storage.getLatestWeatherData(STATION_ID);
            if (dbFallback) {
                return res.json({ ...dbFallback, stale: true, cached: true });
            }
        } catch (cacheError) { }

        res.status(500).json({
            error: "Failed to fetch weather data",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

weatherRouter.post("/refresh", async (req, res) => {
    try {
        const freshData = await fetchWeatherFlowData();
        const savedData = await storage.saveWeatherData(freshData);
        res.json(savedData);
    } catch (error) {
        res.status(500).json({
            error: "Failed to refresh weather data",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

weatherRouter.get("/alerts", async (req, res) => {
    try {
        const { fetchActiveAlerts } = await import("../noaa-api.js");
        const dbSettings = await storage.getAllSettings();
        const lat = dbSettings.radarCenterLat || process.env.VITE_RADAR_CENTER_LAT;
        const lon = dbSettings.radarCenterLon || process.env.VITE_RADAR_CENTER_LON;

        const alerts = await fetchActiveAlerts(String(lat), String(lon));
        res.json({ alerts });
    } catch (error) {
        console.error("Error fetching weather alerts:", error);
        res.status(500).json({ error: "Failed to fetch weather alerts" });
    }
});

weatherRouter.get("/history/:hours", async (req, res) => {
    try {
        const hours = parseInt(req.params.hours) || 24;
        const history = await storage.getWeatherHistory(STATION_ID, hours);
        res.json(history);
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch weather history",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
