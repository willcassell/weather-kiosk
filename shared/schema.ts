import { pgTable, text, serial, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull(),
  stationName: text("station_name"), // Weather station display name
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  temperature: real("temperature"), // Current temperature in Fahrenheit
  feelsLike: real("feels_like"), // Feels-like temperature in Fahrenheit
  temperatureHigh: real("temperature_high"), // Daily high temperature
  temperatureLow: real("temperature_low"), // Daily low temperature
  temperatureHighTime: timestamp("temperature_high_time"), // Time when high temp was observed
  temperatureLowTime: timestamp("temperature_low_time"), // Time when low temp was observed
  windSpeed: real("wind_speed"), // Wind speed in mph
  windGust: real("wind_gust"), // Wind gust in mph
  windDirection: integer("wind_direction"), // Wind direction in degrees (0-360)
  windDirectionCardinal: text("wind_direction_cardinal"), // Wind direction as cardinal (N, NE, E, etc.)
  pressure: real("pressure"), // Barometric pressure in inHg
  pressureTrend: text("pressure_trend"), // Trend: "Rising", "Falling", "Steady"
  humidity: real("humidity"), // Humidity percentage
  uvIndex: real("uv_index"), // UV index
  lightningStrikeDistance: real("lightning_strike_distance"), // Distance to last lightning strike in miles
  lightningStrikeTime: timestamp("lightning_strike_time"), // Time of last lightning strike
  dewPoint: real("dew_point"), // Dew point temperature in Fahrenheit
  rainToday: real("rain_today"), // Rain accumulation today in inches
  rainYesterday: real("rain_yesterday"), // Rain accumulation yesterday in inches
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
  id: true,
  timestamp: true,
  lastUpdated: true,
});

export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type WeatherData = typeof weatherData.$inferSelect;

// Thermostat data schema
export const thermostatData = pgTable("thermostat_data", {
  id: serial("id").primaryKey(),
  thermostatId: text("thermostat_id").notNull(),
  name: text("name").notNull(), // Display name/location
  temperature: real("temperature").notNull(), // Current temperature in Fahrenheit
  targetTemp: real("target_temp").notNull(), // Target temperature in Fahrenheit
  humidity: real("humidity"), // Humidity percentage (optional)
  mode: text("mode").notNull(), // heat, cool, auto, off
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertThermostatDataSchema = createInsertSchema(thermostatData).omit({
  id: true,
  timestamp: true,
  lastUpdated: true,
});

export type InsertThermostatData = z.infer<typeof insertThermostatDataSchema>;
export type ThermostatData = typeof thermostatData.$inferSelect;

// WeatherFlow API response types
export interface WeatherFlowStation {
  station_id: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  devices: Array<{
    device_id: number;
    device_type: string;
    device_meta: {
      name: string;
    };
  }>;
}

export interface WeatherFlowObservation {
  station_id: number;
  obs: Array<{
    timestamp: number;
    air_temperature: number;
    barometric_pressure: number;
    station_pressure: number;
    relative_humidity: number;
    wind_avg: number;
    wind_direction: number;
    wind_gust: number;
    solar_radiation: number;
    uv: number;
    rain_accumulation: number;
    precipitation_type: number;
    lightning_strike_avg_distance: number;
    lightning_strike_count: number;
    battery: number;
  }>;
}

export interface WeatherFlowForecast {
  station_id: number;
  current_conditions: {
    time: number;
    conditions: string;
    icon: string;
    air_temperature: number;
    feels_like: number;
    sea_level_pressure: number;
    station_pressure: number;
    pressure_trend: string;
    relative_humidity: number;
    wind_avg: number;
    wind_direction: number;
    wind_gust: number;
    solar_radiation: number;
    uv: number;
    brightness: number;
    dew_point: number;
    wet_bulb_globe_temperature: number;
    delta_t: number;
    air_density: number;
  };
  forecast: {
    daily: Array<{
      day_start_local: number;
      day_num: number;
      month_num: number;
      conditions: string;
      icon: string;
      sunrise: number;
      sunset: number;
      air_temp_high: number;
      air_temp_low: number;
      precip_probability: number;
      precip_type: string;
      precip_icon: string;
    }>;
  };
}
