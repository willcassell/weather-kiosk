import { z } from 'zod';

/**
 * Zod validation schemas for external API responses
 * Prevents runtime errors from unexpected API response formats
 */

// ============================================================================
// BEESTAT API VALIDATION SCHEMAS
// ============================================================================

const BeestatProgramClimateSchema = z.object({
  name: z.string().optional(),
  climateRef: z.string().optional(),
  heatTemp: z.number().optional(), // In tenths of degrees
  coolTemp: z.number().optional(), // In tenths of degrees
  isOccupied: z.boolean().optional(),
});

const BeestatProgramSchema = z.object({
  currentClimateRef: z.string().optional(),
  climates: z.array(BeestatProgramClimateSchema).optional(),
});

const BeestatSettingsSchema = z.object({
  hvacMode: z.string().optional(),
  differential_cool: z.number().optional(),
  differential_heat: z.number().optional(),
}).optional();

export const BeestatThermostatSchema = z.object({
  ecobee_thermostat_id: z.number(),
  identifier: z.string(),
  name: z.string(),
  temperature: z.number(),
  setpoint_heat: z.number().optional().nullable(),
  setpoint_cool: z.number().optional().nullable(),
  humidity: z.number().optional().nullable(),
  hvac_mode: z.string().optional().nullable(),
  settings: BeestatSettingsSchema,
  running_equipment: z.array(z.string()).default([]),
  program: BeestatProgramSchema.optional(),
});

export const BeestatResponseSchema = z.object({
  data: z.record(z.string(), BeestatThermostatSchema).optional(),
  success: z.boolean().optional(),
  message: z.string().optional(),
});

export type BeestatThermostat = z.infer<typeof BeestatThermostatSchema>;
export type BeestatResponse = z.infer<typeof BeestatResponseSchema>;

// ============================================================================
// WEATHERFLOW API VALIDATION SCHEMAS
// ============================================================================

const WeatherFlowDeviceSchema = z.object({
  device_id: z.number(),
  device_type: z.string(),
  device_meta: z.object({
    name: z.string(),
  }),
});

export const WeatherFlowStationSchema = z.object({
  station_id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  elevation: z.number(),
  devices: z.array(WeatherFlowDeviceSchema),
});

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
  precipitation_type: z.number(),
  lightning_strike_avg_distance: z.number().optional(),
  lightning_strike_count: z.number().optional(),
  battery: z.number(),
  feels_like: z.number().optional(),
});

export const WeatherFlowObservationSchema = z.object({
  station_id: z.number(),
  obs: z.array(WeatherFlowObsDataSchema),
});

const WeatherFlowCurrentConditionsSchema = z.object({
  time: z.number(),
  conditions: z.string(),
  icon: z.string(),
  air_temperature: z.number(),
  feels_like: z.number(),
  sea_level_pressure: z.number(),
  station_pressure: z.number(),
  pressure_trend: z.string(),
  relative_humidity: z.number(),
  wind_avg: z.number(),
  wind_direction: z.number(),
  wind_gust: z.number(),
  solar_radiation: z.number(),
  uv: z.number(),
  brightness: z.number(),
  dew_point: z.number(),
  wet_bulb_globe_temperature: z.number(),
  delta_t: z.number(),
  air_density: z.number(),
  // Additional fields that may be present
  precip_accum_local_day: z.number().optional(),
  precip_accum_local_yesterday: z.number().optional(),
  lightning_strike_count_last_1hr: z.number().optional(),
  lightning_strike_count_last_3hr: z.number().optional(),
  lightning_strike_last_distance: z.number().optional(),
  lightning_strike_last_epoch: z.number().optional(),
});

const WeatherFlowDailyForecastSchema = z.object({
  day_start_local: z.number(),
  day_num: z.number(),
  month_num: z.number(),
  conditions: z.string(),
  icon: z.string(),
  sunrise: z.number(),
  sunset: z.number(),
  air_temp_high: z.number(),
  air_temp_low: z.number(),
  precip_probability: z.number(),
  precip_type: z.string(),
  precip_icon: z.string(),
});

export const WeatherFlowForecastSchema = z.object({
  station_id: z.number(),
  current_conditions: WeatherFlowCurrentConditionsSchema,
  forecast: z.object({
    daily: z.array(WeatherFlowDailyForecastSchema),
  }),
});

export type WeatherFlowStation = z.infer<typeof WeatherFlowStationSchema>;
export type WeatherFlowObservation = z.infer<typeof WeatherFlowObservationSchema>;
export type WeatherFlowForecast = z.infer<typeof WeatherFlowForecastSchema>;

// ============================================================================
// DATA QUALITY VALIDATION
// ============================================================================

/**
 * Validates sensor data for anomalies and quality issues
 * @returns Array of warning messages if issues found, empty array if data is valid
 */
export function validateWeatherDataQuality(data: {
  temperature?: number | null;
  windSpeed?: number | null;
  pressure?: number | null;
  humidity?: number | null;
}): string[] {
  const warnings: string[] = [];

  // Temperature checks (Fahrenheit)
  if (data.temperature !== null && data.temperature !== undefined) {
    if (data.temperature < -50 || data.temperature > 150) {
      warnings.push(`Temperature ${data.temperature}°F is out of reasonable range (-50°F to 150°F)`);
    }
  }

  // Wind speed checks (mph)
  if (data.windSpeed !== null && data.windSpeed !== undefined) {
    if (data.windSpeed < 0) {
      warnings.push(`Wind speed ${data.windSpeed} mph is negative (sensor error)`);
    }
    if (data.windSpeed > 200) {
      warnings.push(`Wind speed ${data.windSpeed} mph exceeds reasonable max (200 mph)`);
    }
  }

  // Pressure checks (inHg)
  if (data.pressure !== null && data.pressure !== undefined) {
    if (data.pressure < 28 || data.pressure > 32) {
      warnings.push(`Pressure ${data.pressure} inHg is out of reasonable range (28-32 inHg)`);
    }
  }

  // Humidity checks (%)
  if (data.humidity !== null && data.humidity !== undefined) {
    if (data.humidity < 0 || data.humidity > 100) {
      warnings.push(`Humidity ${data.humidity}% is out of valid range (0-100%)`);
    }
  }

  return warnings;
}

/**
 * Detects sudden temperature spikes that may indicate sensor errors
 */
export function detectTemperatureSpike(
  currentTemp: number,
  previousTemp: number,
  maxDeltaF: number = 20
): boolean {
  const delta = Math.abs(currentTemp - previousTemp);
  return delta > maxDeltaF;
}
