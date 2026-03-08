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
  identifier: z.string().optional(), // Not always present
  name: z.string(),
  temperature: z.number(),
  setpoint_heat: z.number().optional().nullable(),
  setpoint_cool: z.number().optional().nullable(),
  humidity: z.number().optional().nullable(),
  hvac_mode: z.string().optional().nullable(),
  settings: BeestatSettingsSchema,
  running_equipment: z.array(z.string()).default([]),
  program: BeestatProgramSchema.optional(),
}).passthrough();

export const BeestatResponseSchema = z.object({
  data: z.record(z.string(), BeestatThermostatSchema).optional(),
  success: z.boolean().optional(),
  message: z.string().optional(),
}).passthrough();

export const BeestatSensorSchema = z.object({
  sensor_id: z.number(),
  thermostat_id: z.number(),
  ecobee_sensor_id: z.number(),
  identifier: z.string(),
  name: z.string(),
  type: z.string(),
  in_use: z.boolean(),
  temperature: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  occupancy: z.boolean(),
}).passthrough();

export const BeestatSensorResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), BeestatSensorSchema),
});

export type BeestatThermostat = z.infer<typeof BeestatThermostatSchema>;
export type BeestatResponse = z.infer<typeof BeestatResponseSchema>;
export type BeestatSensor = z.infer<typeof BeestatSensorSchema>;
export type BeestatSensorResponse = z.infer<typeof BeestatSensorResponseSchema>;

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
  station_id: z.number().optional(),
  name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timezone: z.string().optional(),
  elevation: z.number().optional(),
  devices: z.array(WeatherFlowDeviceSchema).optional(),
}).passthrough();

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

export const WeatherFlowObservationSchema = z.object({
  station_id: z.number().optional(),
  obs: z.array(WeatherFlowObsDataSchema),
}).passthrough();

const WeatherFlowCurrentConditionsSchema = z.object({
  time: z.number().optional(),
  conditions: z.string().optional(),
  icon: z.string().optional(),
  air_temperature: z.number(),
  feels_like: z.number().optional(),
  sea_level_pressure: z.number().optional(),
  station_pressure: z.number().optional(),
  pressure_trend: z.string().optional(),
  relative_humidity: z.number(),
  wind_avg: z.number(),
  wind_direction: z.number(),
  wind_gust: z.number(),
  solar_radiation: z.number().optional(),
  uv: z.number().optional(),
  brightness: z.number().optional(),
  dew_point: z.number().optional(),
  wet_bulb_globe_temperature: z.number().optional(),
  delta_t: z.number().optional(),
  air_density: z.number().optional(),
  // Additional fields that may be present
  precip_accum_local_day: z.number().optional(),
  precip_accum_local_yesterday: z.number().optional(),
  lightning_strike_count_last_1hr: z.number().optional(),
  lightning_strike_count_last_3hr: z.number().optional(),
  lightning_strike_last_distance: z.number().optional(),
  lightning_strike_last_epoch: z.number().optional(),
}).passthrough();

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
  precip_type: z.string().optional(),
  precip_icon: z.string().optional(),
});

export const WeatherFlowForecastSchema = z.object({
  station_id: z.number().optional(),
  current_conditions: WeatherFlowCurrentConditionsSchema,
  forecast: z.object({
    daily: z.array(WeatherFlowDailyForecastSchema),
  }).optional(),
}).passthrough(); // Allow additional fields we might not have defined

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
