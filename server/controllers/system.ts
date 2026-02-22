import { Router } from "express";
import { storage } from "../storage";
import { metrics } from "../metrics.js";

// Helper to get token (can be moved to a shared util later)
const getApiToken = () => {
    return process.env.WEATHERFLOW_API_TOKEN ||
        process.env.TEMPEST_API_TOKEN ||
        process.env.API_TOKEN ||
        process.env.WEATHERFLOW_ACCESS_TOKEN;
};

import { dataCache } from '../cache.js';

async function initializeCache() {
    return dataCache;
}

export const systemRouter = Router();

// Enhanced health check endpoint for deployment monitoring
systemRouter.get("/health", async (req, res) => {
    try {
        const healthStatus: any = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            uptimeFormatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
            environment: process.env.NODE_ENV || "development",
            version: process.version,
            port: process.env.PORT || "5000"
        };

        // Database health check
        if (process.env.DATABASE_URL) {
            const dbStartTime = Date.now();
            try {
                const STATION_ID = process.env.WEATHERFLOW_STATION_ID || "38335";
                const latestData = await storage.getLatestWeatherData(STATION_ID);
                const dbLatency = Date.now() - dbStartTime;

                healthStatus.database = {
                    connected: true,
                    latency: `${dbLatency}ms`,
                    lastWeatherUpdate: latestData?.lastUpdated || null
                };
            } catch (error) {
                healthStatus.database = {
                    connected: false,
                    error: error instanceof Error ? error.message : "Connection failed"
                };
                healthStatus.status = "degraded";
            }
        } else {
            healthStatus.database = {
                connected: false,
                message: "Using in-memory storage (DATABASE_URL not configured)"
            };
        }

        // WeatherFlow API health check
        try {
            const STATION_ID = process.env.WEATHERFLOW_STATION_ID || "38335";
            const cache = await initializeCache();
            const cacheKey = `weather:${STATION_ID}`;
            const cachedWeather = cache.get<any>(cacheKey);

            healthStatus.weatherFlowAPI = {
                configured: !!getApiToken(),
                lastFetch: cachedWeather?.lastUpdated || null,
                status: cachedWeather ? "ok" : "no recent data"
            };
        } catch (error) {
            healthStatus.weatherFlowAPI = {
                configured: !!getApiToken(),
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }

        // Beestat API health check
        if (process.env.BEESTAT_API_KEY) {
            try {
                const thermostatData = await storage.getLatestThermostatData();
                healthStatus.beestatAPI = {
                    configured: true,
                    status: thermostatData.length > 0 ? "ok" : "no data",
                    lastFetch: thermostatData[0]?.lastUpdated || null,
                    thermostatCount: thermostatData.length
                };
            } catch (error) {
                healthStatus.beestatAPI = {
                    configured: true,
                    status: "error",
                    error: error instanceof Error ? error.message : "Unknown error"
                };
                healthStatus.status = "degraded";
            }
        } else {
            healthStatus.beestatAPI = {
                configured: false,
                status: "disabled"
            };
        }

        // Memory usage
        const memUsage = process.memoryUsage();
        healthStatus.memory = {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        };

        // Background jobs status
        healthStatus.backgroundJobs = {
            thermostatSync: process.env.BEESTAT_API_KEY ? "running" : "disabled",
            databaseCleanup: process.env.DATABASE_URL ? "scheduled" : "disabled"
        };

        res.status(200).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// Analytics/Metrics endpoint
systemRouter.get("/metrics", async (req, res) => {
    try {
        const summary = await storage.getMetricsSummary(100);
        res.json(summary);
    } catch (error) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
});

// Configuration UI endpoints
systemRouter.get("/config", async (req, res) => {
    try {
        const dbSettings = await storage.getAllSettings();
        // Merge with environment variable defaults
        const config = {
            displayName: dbSettings.displayName || process.env.VITE_STATION_DISPLAY_NAME || "Corner Rock Wx",
            unitSystem: dbSettings.unitSystem || process.env.VITE_UNIT_SYSTEM || "imperial",
            timezone: dbSettings.timezone || process.env.TIMEZONE || "America/New_York",
            weatherRefreshInterval: dbSettings.weatherRefreshInterval || "3",
            thermostatRefreshInterval: dbSettings.thermostatRefreshInterval || "3",
            healthCheckInterval: dbSettings.healthCheckInterval || "1",
            radarCenterLat: dbSettings.radarCenterLat || process.env.VITE_RADAR_CENTER_LAT || "37.000",
            radarCenterLon: dbSettings.radarCenterLon || process.env.VITE_RADAR_CENTER_LON || "-78.415",
            radarZoomLevel: dbSettings.radarZoomLevel || process.env.VITE_RADAR_ZOOM_LEVEL || "7.25",
            retentionWeatherObservations: dbSettings.retentionWeatherObservations || process.env.RETENTION_WEATHER_OBSERVATIONS_DAYS || "7",
            retentionWeatherData: dbSettings.retentionWeatherData || process.env.RETENTION_WEATHER_DATA_DAYS || "2",
            retentionThermostatData: dbSettings.retentionThermostatData || process.env.RETENTION_THERMOSTAT_DATA_DAYS || "90",
            retentionBeestatRaw: dbSettings.retentionBeestatRaw || process.env.RETENTION_BEESTAT_RAW_DAYS || "7",
            cleanupSchedule: dbSettings.cleanupSchedule || "03:00",
            hasPassword: !!dbSettings.adminPassword,
            ...Object.fromEntries(Object.entries(dbSettings).filter(([k]) => k !== 'adminPassword'))
        };

        // Ensure no secrets are leaked
        const envSecrets = {
            weatherFlowTokenMasked: getApiToken() ? `****-****-****-${getApiToken()!.slice(-3)}` : null,
            beestatKeyMasked: process.env.BEESTAT_API_KEY ? `****-****-****-${process.env.BEESTAT_API_KEY.slice(-3)}` : null,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
        };

        res.json({ config, secrets: envSecrets });
    } catch (error) {
        console.error("Error getting config:", error);
        res.status(500).json({ error: "Failed to fetch configuration" });
    }
});

systemRouter.post("/config", async (req, res) => {
    try {
        const currentSettings = await storage.getAllSettings();

        // If a password is set, require it
        if (currentSettings.adminPassword && req.body.password !== currentSettings.adminPassword) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Filter out password from plain settings map
        const { password, ...settingsToSave } = req.body;

        if (req.body.newPassword && typeof req.body.newPassword === 'string') {
            settingsToSave.adminPassword = req.body.newPassword;
        }

        // Convert everything to string for Postgres storage
        const finalSettings: Record<string, string> = {};
        for (const [k, v] of Object.entries(settingsToSave)) {
            if (v !== undefined && v !== null) {
                finalSettings[k] = String(v);
            }
        }

        await storage.updateSettings(finalSettings);

        // Dynamically restart the background schedulers using the newly saved intervals
        const { restartAllJobs } = await import('../background-jobs.js');
        await restartAllJobs();

        res.json({ success: true, message: "Configuration saved successfully" });
    } catch (error) {
        console.error("Error updating config:", error);
        res.status(500).json({ error: "Failed to update configuration" });
    }
});
