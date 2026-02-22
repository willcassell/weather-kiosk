import { z } from "zod";

const WeatherFlowObsDataSchema = z.object({
    timestamp: z.number(),
    air_temperature: z.number(),
    barometric_pressure: z.number().optional(),
    station_pressure: z.number(),
    relative_humidity: z.number(),
    wind_avg: z.number(),
    wind_direction: z.number(),
    wind_gust: z.number(),
    solar_radiation: z.number(),
    uv: z.number(),
    rain_accumulation: z.number().optional(),
    precipitation_type: z.number().optional(),
    lightning_strike_avg_distance: z.number().optional(),
    lightning_strike_count: z.number().optional(),
    battery: z.number().optional(),
    feels_like: z.number().optional(),
    dew_point: z.number().optional(),
}).passthrough();

const WeatherFlowObservationSchema = z.object({
    station_id: z.number().optional(),
    obs: z.array(WeatherFlowObsDataSchema),
}).passthrough();

const payload = {
    "status": {
        "status_code": 0,
        "status_message": "SUCCESS"
    },
    "elevation": 114.30000000000001,
    "is_public": true,
    "latitude": 37.52603,
    "longitude": -77.63093,
    "obs": [
        {
            "air_density": 1.2581,
            "air_temperature": 3.8,
            "barometric_pressure": 1000.2,
            "brightness": 4987,
            "delta_t": 0.1,
            "dew_point": 3.4,
            "feels_like": 3.8,
            "heat_index": 3.8,
            "lightning_strike_count": 0,
            "lightning_strike_count_last_1hr": 0,
            "lightning_strike_count_last_3hr": 0,
            "lightning_strike_last_distance": 34,
            "lightning_strike_last_epoch": 1764146964,
            "precip": 0.011475,
            "precip_accum_last_1hr": 1.651375,
            "precip_accum_local_day": 3.616845,
            "precip_accum_local_day_final": 3.616845,
            "precip_accum_local_yesterday": 0.0,
            "precip_accum_local_yesterday_final": 0.0,
            "precip_analysis_type_yesterday": 0,
            "precip_minutes_local_day": 179,
            "precip_minutes_local_yesterday": 0,
            "precip_minutes_local_yesterday_final": 0,
            "pressure_trend": "rising",
            "relative_humidity": 97,
            "sea_level_pressure": 1014.4,
            "solar_radiation": 42,
            "station_pressure": 1000.2,
            "timestamp": 1771773551,
            "uv": 0.17,
            "wet_bulb_globe_temperature": 4.0,
            "wet_bulb_temperature": 3.7,
            "wind_avg": 0.4,
            "wind_chill": 3.8,
            "wind_direction": 232,
            "wind_gust": 0.7,
            "wind_lull": 0.3
        }
    ],
    "public_name": "Corner Rock Rd",
    "station_id": 38335,
    "station_name": "Corner Rock Wx",
    "timezone": "America/New_York"
};

const res = WeatherFlowObservationSchema.safeParse(payload);
if (!res.success) {
    console.log(JSON.stringify(res.error.errors, null, 2));
} else {
    console.log("SUCCESS!");
}
