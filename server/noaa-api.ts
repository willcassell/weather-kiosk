import { z } from "zod";

export const WeatherAlertSchema = z.object({
    id: z.string(),
    event: z.string(),   // e.g. "Severe Thunderstorm Warning"
    severity: z.string(), // "Extreme", "Severe", "Moderate", "Minor", "Unknown"
    headline: z.string(),
    description: z.string(),
    instruction: z.string().optional().nullable(),
    effective: z.string(),
    expires: z.string(),
});

export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

const NOAA_BASE_URL = "https://api.weather.gov";

/**
 * Fetch active weather alerts for a specific coordinate
 * @param lat Latitude 
 * @param lon Longitude
 * @returns Array of parsed WeatherAlert objects
 */
export async function fetchActiveAlerts(lat: string | undefined, lon: string | undefined): Promise<WeatherAlert[]> {
    if (!lat || !lon) {
        console.warn("Skipping NOAA alerts fetch; lat/lon not provided.");
        return [];
    }

    try {
        const response = await fetch(`${NOAA_BASE_URL}/alerts/active?point=${lat},${lon}`, {
            headers: {
                'User-Agent': '(weather-kiosk-app, https://github.com/user/weather-kiosk)'
            }
        });

        if (!response.ok) {
            throw new Error(`NOAA API returned status: ${response.status}`);
        }

        const data = await response.json();

        const alerts: WeatherAlert[] = (data.features || []).map((feature: any) => ({
            id: feature.properties.id,
            event: feature.properties.event,
            severity: feature.properties.severity,
            headline: feature.properties.headline || "",
            description: feature.properties.description || "",
            instruction: feature.properties.instruction,
            effective: feature.properties.effective,
            expires: feature.properties.expires,
        }));

        // Sort by severity (Extreme first, then Severe, then others)
        const severityOrder: Record<string, number> = {
            "Extreme": 0,
            "Severe": 1,
            "Moderate": 2,
            "Minor": 3,
            "Unknown": 4
        };

        return alerts.sort((a, b) => {
            const orderA = severityOrder[a.severity] ?? 5;
            const orderB = severityOrder[b.severity] ?? 5;
            return orderA - orderB;
        });

    } catch (error) {
        console.error("Failed to fetch NOAA active alerts:", error);
        // Return empty array on failure so UI doesn't crash
        return [];
    }
}
