import { Router } from "express";
import { storage } from "../storage";
import { fetchBeestatThermostats } from '../beestat-api';
import { EcobeeAPI } from "../ecobee-api";

export const thermostatRouter = Router();

// Get Ecobee API key
const getEcobeeApiKey = () => {
    return process.env.ECOBEE_API_KEY;
};

import { dataCache } from '../cache.js';

async function initializeCache() {
    return dataCache;
}

thermostatRouter.get("/current", async (req, res) => {
    try {
        // ALWAYS fetch from database - never use cache
        // The database is updated by a background job, so it's always fresh
        console.log(`Fetching thermostat data from database`);

        const thermostatData = await storage.getLatestThermostatData();

        // No browser caching - always fetch fresh
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Expires': '0',
            'Pragma': 'no-cache'
        });

        if (!thermostatData || thermostatData.length === 0) {
            console.log("No thermostat data in database");
            return res.json({
                thermostats: [],
                cached: false,
                stale: false
            });
        }

        const lastUpdated = thermostatData[0]?.lastUpdated;
        const dataAge = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() : 0;
        const isStale = dataAge > 5 * 60 * 1000;

        return res.json({
            thermostats: thermostatData,
            cached: false,
            stale: isStale,
            lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : new Date().toISOString()
        });

    } catch (error) {
        console.error("Error getting thermostat data:", error);
        res.status(500).json({
            error: "Failed to fetch thermostat data",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

thermostatRouter.post("/refresh", async (req, res) => {
    console.log("POST /api/thermostats/refresh - forcing fresh data");
    try {
        if (!process.env.BEESTAT_API_KEY) {
            return res.status(400).json({ error: "BEESTAT_API_KEY not configured" });
        }

        const thermostatData = await fetchBeestatThermostats();

        const cache = await initializeCache();
        const cacheKey = `thermostats:current`;
        cache.set(cacheKey, thermostatData, 2);

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
thermostatRouter.post("/auth/start", async (req, res) => {
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

thermostatRouter.post("/auth/complete", async (req, res) => {
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

thermostatRouter.get("/auth/status", async (req, res) => {
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
